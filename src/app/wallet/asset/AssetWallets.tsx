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
import { Wallet } from '@/services/walletService';
import { getAssetBySymbol } from '@/services/assetService';
import { fetchAddresses } from '@/services/addressService';
import { getWalletsByUser } from '@/services/walletService';
import { API_BASE_URL } from '@/config/environment';

// 가격 데이터 매핑 (실제로는 별도 API에서 가져와야 함)
const priceData: Record<string, {price: string, change24h: string}> = {
  'BTC': { price: '$95,563.72', change24h: '+1.2%' },
  'ETH': { price: '$1,827.29', change24h: '-0.5%' },
  'USDT': { price: '$1.00', change24h: '0.0%' },
  'BNB': { price: '$594.90', change24h: '+0.8%' },
  'SOL': { price: '$145.42', change24h: '+3.2%' },
  'USD': { price: '$1.00', change24h: '0.0%' }
};

// 잔액 API 응답 타입
interface ApiBalance {
  balNum: number;
  adrId: number;
  astId: number;
  balBefore: number;
  balAfter: number;
  balConfirmed: number;
  balPending: number;
  creusr: number;
  credat: string;
  cretim: string;
  active: string;
}

// 스타일링된 컴포넌트
const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 2),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '12px',
}));

// 지갑 아이콘 컴포넌트
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

interface WalletData extends Wallet {
  balance: number;
  balanceUsd: string;
}

export default function AssetWallets(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetSymbol = searchParams.get('symbol');
  const assetName = searchParams.get('name');
  
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'walName' | 'balance'>('walName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalBalance, setTotalBalance] = useState<string>('$0.00 USD');
  const [totalCrypto, setTotalCrypto] = useState<string>('0 BTC');
  
  const open = Boolean(anchorEl);

  // 지갑 데이터 가져오기
  useEffect(() => {
    if (!assetSymbol) {
      router.push('/wallet');
      return;
    }
    
    fetchWallets();
  }, [assetSymbol, router]);

  // 잔액 데이터 가져오기
  const fetchBalance = async (addressId: number, assetId: number) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/balances/address/${addressId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status}`);
      }
      
      const balanceDataArray: ApiBalance[] = await response.json();
      
      if (balanceDataArray.length === 0) {
        return null;
      }
      
      const matchingBalances = balanceDataArray.filter(bal => bal.astId === assetId);
      
      if (matchingBalances.length === 0) {
        return null;
      }
      
      return matchingBalances.reduce((latest, current) => {
        if (current.credat > latest.credat) {
          return current;
        } else if (current.credat < latest.credat) {
          return latest;
        }
        
        if (current.cretim > latest.cretim) {
          return current;
        } else {
          return latest;
        }
      });
    } catch (err) {
      console.error(`Error fetching balance for address ID ${addressId}:`, err);
      return null;
    }
  };

  // 지갑 데이터 가져오기
  const fetchWallets = async () => {
    if (!assetSymbol) return;
    
    setLoading(true);
    setError(null);
    
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
        wallet.astId === asset.astNum
      );

      // 5. 각 지갑의 잔액 정보 가져오기
      const walletsWithBalance = await Promise.all(
        walletsData.map(async (wallet) => {
          // 지갑에 연결된 주소 목록 가져오기
          const addresses = await fetchAddresses(wallet.walNum || 0);
          
          // 지갑의 총 잔액 계산 (각 주소의 잔액을 합산)
          let totalConfirmedBalance = 0;
          let totalUsdValue = 0;
          
          if (addresses.length > 0) {
            // 각 주소에 대한 잔액 가져오기
            const balancePromises = addresses.map(addr => 
              fetchBalance(addr.adrNum || 0, asset.astNum || 0)
            );
            const balanceResults = await Promise.all(balancePromises);
            
            // 잔액 합산
            balanceResults.forEach(balanceData => {
              if (balanceData) {
                totalConfirmedBalance += balanceData.balConfirmed;
                
                // USD 가치 계산
                const priceValue = parseFloat(
                  priceData[assetSymbol]?.price.replace('$', '').replace(',', '') || '0'
                );
                const balanceValue = balanceData.balConfirmed * priceValue / 
                  Math.pow(10, asset.astDecimals || 0);
                totalUsdValue += balanceValue;
              }
            });
          }
          
          return {
            ...wallet,
            balance: totalConfirmedBalance,
            balanceUsd: `$${totalUsdValue.toFixed(2)} USD`
          };
        })
      );
      
      setWallets(walletsWithBalance);
      
      // 총 자산 가치 계산
      calculateTotalBalance(walletsWithBalance, assetSymbol);
      
      if (refreshing) {
        setRefreshing(false);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('An error occurred while loading wallet data. Please check your network connection.');
      setRefreshing(false);
    } finally {
      setLoading(false);
    }
  };

  // 총 잔액 계산
  const calculateTotalBalance = (walletList: WalletData[], symbol: string) => {
    const total = walletList.reduce((sum, wallet) => sum + wallet.balance, 0);
    const totalUsd = walletList.reduce((sum, wallet) => {
      const usdValue = parseFloat(wallet.balanceUsd.replace('$', '').replace(',', '').split(' ')[0] || '0');
      return sum + usdValue;
    }, 0);
    
    setTotalCrypto(`${total.toFixed(8)} ${symbol}`);
    setTotalBalance(`$${totalUsd.toFixed(2)} USD`);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallets();
  };
  
  // 정렬 메뉴 열기
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 정렬 메뉴 닫기 및 정렬 적용
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
  
  // 검색어 변경 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 지갑 생성 핸들러
  const handleCreateWallet = () => {
    // 자산 정보를 URL 파라미터로 전달
    router.push(`/wallet/create?assetType=${assetName}`);
  };

  // Deposit handler
  const handleDeposit = (wallet: WalletData) => {
    // Deposit functionality to be implemented
    console.log('Deposit processing:', wallet);
  };

  // Withdrawal handler
  const handleWithdraw = (wallet: WalletData) => {
    // Withdrawal functionality to be implemented
    console.log('Withdrawal processing:', wallet);
  };

  // 뒤로 가기
  const handleBack = () => {
    router.push('/wallet');
  };

  // 정렬 함수
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

  // 검색 함수
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
  
  // 검색 및 정렬이 적용된 지갑 목록
  const filteredWallets = sortWalletsList(
    searchWalletsList(wallets, searchTerm),
    sortBy,
    sortDirection
  );

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
        
        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
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
                          Admin
                        </Typography>
                      </TableCell>
                      
                      {/* 액션 버튼 */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <ActionButton 
                            variant="outlined" 
                            onClick={() => handleDeposit(wallet)}
                            startIcon={<DownloadIcon fontSize="small" />}
                          >
                            Deposit
                          </ActionButton>
                          <ActionButton 
                            variant="outlined" 
                            onClick={() => handleWithdraw(wallet)}
                            disabled={wallet.balance === 0}
                            startIcon={<FileUploadIcon fontSize="small" />}
                          >
                            Withdraw
                          </ActionButton>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
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