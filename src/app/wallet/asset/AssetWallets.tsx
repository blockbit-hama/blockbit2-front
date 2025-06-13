"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';

import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import { brand, gray } from '@/theme/themePrimitives';
import { fetchWithAuth, getUserId } from '@/lib/auth';
import { getAssetBySymbol } from '@/services/assetService';
import { API_BASE_URL } from '@/config/environment';
import { getWalletsByUser } from '@/services/walletsService';
import { getWalletMappingsByUser } from '@/services/walUsiMappService';
import { getWalletAddressesByWallet } from '@/services/walletAddressesService';
import { getBitcoinAddressBalance } from '@/services/walletsService';
import { getBitcoinPrice } from '@/lib/priceService';

interface WalletData {
  walNum: number;
  walName: string;
  walType: string;
  walProtocol: string;
  walStatus: string;
  wumRole: string;
  astNum: number;
  balance: number;
  balanceUsd: string;
  wadAddress: string;
}

const WalletIcon = styled('div')(() => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: brand[100],
  color: brand[600],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '14px',
}));

export default function AssetWallets(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetSymbol = searchParams.get('symbol');

  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalBalance, setTotalBalance] = useState<string>('$0.00 USD');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'walName' | 'balance'>('walName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  
  const open = Boolean(anchorEl);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      await fetchWallets();
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  }

  const fetchWallets = async () => {
    if (!assetSymbol) return;
    
    setLoading(true);
    
    try {
      // 1. 현재 로그인한 사용자 ID 가져오기
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // 2. 자산 정보 가져오기
      const asset = await getAssetBySymbol(assetSymbol);
      if (!asset) {
        throw new Error(`Asset with symbol ${assetSymbol} not found`);
      }

      // 3. 사용자의 지갑 목록 가져오기
      const userWallets = await getWalletsByUser(userId);
      
      // 4. 현재 자산에 해당하는 지갑만 필터링
      const walletsData = userWallets.filter(wallet => 
        wallet.astNum === asset.astNum
      );

      // 비트코인 시세 가져오기 (한 번만)
      let price = btcPrice;
      if (!btcPrice) {
        const priceData = await getBitcoinPrice();
        price = priceData.price;
        setBtcPrice(price);
      }

      // 각 지갑의 대표 주소의 잔액 가져오기
      const walletsWithBalance = await Promise.all(
        walletsData.map(async (wallet) => {
          let balance = 0;
          let formattedBalance = '0';
          let wadAddress = '';
          try {
            const addresses = await getWalletAddressesByWallet(wallet.walNum || 0);
            if (addresses.length > 0) {
              wadAddress = addresses[0].wadAddress;
              const res = await getBitcoinAddressBalance(wadAddress);
              balance = parseFloat(res.formattedBalance);
              formattedBalance = res.formattedBalance;
            }
          } catch {}
          return {
            walNum: wallet.walNum || 0,
            walName: wallet.walName || '',
            walType: wallet.walType || '',
            walProtocol: wallet.walProtocol || '',
            walStatus: wallet.walStatus || '',
            wumRole: wallet.wumRole || '',
            astNum: asset.astNum || 0,
            balance,
            balanceUsd: `$${(balance * price).toFixed(2)} USD`,
            wadAddress,
          };
        })
      );
      
      setWallets(walletsWithBalance);
      
      // 총 자산 가치 계산
      const total = walletsWithBalance.reduce((sum, w) => sum + (typeof w.balance === 'number' ? w.balance * price : 0), 0);
      setTotalBalance(`$${total.toFixed(2)} USD`);
      
      if (refreshing) {
        setRefreshing(false);
      }
    } catch (err) {
      setRefreshing(false);
    } finally {
      setLoading(false);
    }
  };

  const sortWalletsList = (
    walletsList: WalletData[],
    sortField: 'walName' | 'balance',
    direction: 'asc' | 'desc'
  ): WalletData[] => {
    return [...walletsList].sort((a, b) => {
      if (sortField === 'walName') {
        return direction === 'asc' 
          ? (a.walName || '').localeCompare(b.walName || '') 
          : (b.walName || '').localeCompare(a.walName || '');
      }
      
      if (sortField === 'balance') {
        return direction === 'asc' ? a.balance - b.balance : b.balance - a.balance;
      }
      
      return 0;
    });
  };

  const searchWalletsList = (
    walletsList: WalletData[],
    query: string
  ): WalletData[] => {
    if (!query) return walletsList;
    
    const lowercaseQuery = query.toLowerCase();
    return walletsList.filter(wallet =>
      (wallet.walName || '').toLowerCase().includes(lowercaseQuery) ||
      (wallet.walType || '').toLowerCase().includes(lowercaseQuery)
    );
  };

  const filteredWallets = sortWalletsList(
    searchWalletsList(wallets, searchTerm),
    sortBy,
    sortDirection
  );

  const handleBack = () => {
    router.push('/wallet');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallets();
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (field?: 'walName' | 'balance') => {
    if (field) {
      if (field === sortBy) {
        // 같은 필드면 정렬 방향 전환
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        // 다른 필드면 새 필드로 오름차순 정렬
        setSortBy(field);
        setSortDirection('asc');
      }
    }
    setAnchorEl(null);
  };

  const handleDeposit = (wallet: WalletData) => {
    console.log('Deposit processing:', wallet);
  };

  const handleWithdraw = (wallet: WalletData) => {
    console.log('Withdrawal processing:', wallet);
  };

  const handleCreateWallet = () => {
    // 자산 정보를 URL 파라미터로 전달
    router.push('/wallet/create');
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <Container
        maxWidth="lg"
        component="main"
        sx={{ display: 'flex', flexDirection: 'column', mt: 16, mb: 8, gap: 4 }}
      >
        {/* 브레드크럼 네비게이션 */}
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleBack();
            }}
          >
            Assets
          </Link>
          <Typography color="text.primary">{assetSymbol}</Typography>
        </Breadcrumbs>

        {/* 총 자산 가치 영역 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            {totalBalance}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Total value of all your {assetSymbol && assetSymbol.toLowerCase()}
          </Typography>
        </Box>

        {/* 지갑 테이블 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {assetSymbol} Wallets
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 검색 필드 */}
            <TextField
              placeholder="Search wallets..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '8px',
                  backgroundColor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: (theme) => theme.palette.divider,
                  }
                }
              }}
            />
            
            {/* 새로고침 버튼 */}
            <IconButton
              color="primary"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              sx={{ height: '38px', width: '38px' }}
            >
              <RefreshIcon />
            </IconButton>
            
            {/* 정렬 드롭다운 */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClick}
                endIcon={<ArrowDropDownIcon />}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  height: '38px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                View By
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
              >
                <MenuItem onClick={() => handleClose('walName')}>Name</MenuItem>
                <MenuItem onClick={() => handleClose('balance')}>Balance</MenuItem>
              </Menu>
            </Box>
            
            {/* 지갑 생성 버튼 */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateWallet}
              sx={{ 
                borderRadius: '8px',
                textTransform: 'none',
                height: '38px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Create Wallet
            </Button>
          </Box>
        </Box>

        {/* 필터 영역 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '13px',
              px: 2,
              py: 0.5,
            }}
            startIcon={<FilterListIcon />}
          >
            All Filters
          </Button>
          
          <Button
            variant="outlined"
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '13px',
              px: 2,
              py: 0.5,
            }}
          >
            Type
          </Button>
          
          <Button
            variant="outlined"
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '13px',
              px: 2,
              py: 0.5,
            }}
          >
            My Role
          </Button>
        </Box>

        {/* 로딩 상태 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 지갑 테이블 */}
        {!loading && (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: gray[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Wallet</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Role</TableCell>
                  <TableCell sx={{ width: '200px' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm ? 'No search results found.' : 'No wallets available.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWallets.map((wallet) => (
                    <TableRow
                      key={wallet.walNum}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          backgroundColor: (theme) => 
                            theme.palette.mode === 'dark' ? gray[800] : gray[50] 
                        },
                        '& td': { py: 2 } 
                      }}
                      onClick={() => router.push(`/wallet/detail?id=${wallet.walNum}&symbol=${assetSymbol}`)}
                    >
                      {/* 지갑 정보 */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <WalletIcon>
                            {(wallet.walName || '').charAt(0).toUpperCase()}
                          </WalletIcon>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {wallet.walName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {assetSymbol}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {/* 잔액 정보 */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {wallet.balance.toFixed(8)} {assetSymbol}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {wallet.balanceUsd}
                        </Typography>
                      </TableCell>
                      
                      {/* 지갑 타입 */}
                      <TableCell>
                        <Typography variant="body2">
                          {wallet.walType === 'Self-custody Hot' ? 'Self-Custody' : wallet.walType}
                        </Typography>
                      </TableCell>
                      
                      {/* 역할 정보 */}
                      <TableCell>
                        <Typography variant="body2">
                          {wallet.wumRole}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </AppTheme>
  );
}