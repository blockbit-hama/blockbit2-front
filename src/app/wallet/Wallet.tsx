"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';

import { getAssetList } from '@/services/assetService';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { brand, gray, green, red } from '@/theme/themePrimitives';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MoreVertIcon from '@mui/icons-material/MoreVert';    
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useRouter } from 'next/navigation';

interface Asset {
  id: number;
  name: string;
  symbol: string;
  balance: string;
  balanceUsd: string;
  price?: string;
  portfolioPercent?: string;
  type?: string;
  decimals?: number;
  wallets?: ApiWallet[];
}

interface ApiWallet {
  walNum: number;
  walName: string;
  walType: string;
  walProtocol: string;
  walStatus: string;
  astId: number;
  polId: number;
  active: string;
}

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 2),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '12px',
}));

const CoinIcon = ({ symbol }: { symbol: string }) => {
  let bgColor = brand[100];
  let color = brand[700];
  
  switch (symbol) {
    case 'BTC':
      bgColor = '#F7931A20';
      color = '#F7931A';
      break;
    case 'ETH':
      bgColor = '#62688F20';
      color = '#62688F';
      break;
    case 'USDT':
      bgColor = '#26A17B20';
      color = '#26A17B';
      break;
    case 'BNB':
      bgColor = '#F3BA2F20';
      color = '#F3BA2F';
      break;
    case 'SOL':
      bgColor = '#00FFBD20';
      color = '#00FFBD';
      break;
    default:
      bgColor = '#71B2C920';
      color = '#71B2C9';
  }
  
  return (
    <AssetAvatar style={{ backgroundColor: bgColor, color: color }}>
      {symbol.charAt(0)}
    </AssetAvatar>
  );
};

const AssetAvatar = styled(Avatar)(() => ({
  width: 32,
  height: 32,
  backgroundColor: brand[100],
  color: brand[700],
  fontSize: '14px',
  fontWeight: 'bold',
}));

type SortField = 'name' | 'balance';

export default function Wallet(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalBalance, setTotalBalance] = useState('0.00');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });

  const open = Boolean(anchorEl);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setTotalBalance('0.1');
      fetchAssets();
    } catch (error) {
      console.error('초기화 실패:', error);
    }
  }

  const fetchAssets = async () => {
    const assetData = await getAssetList();
    
    const mappedAssets: Asset[] = assetData.map(asset => ({
      id: asset.astNum || 0,
      name: asset.astName || '',
      symbol: asset.astSymbol || '',
      balance: `0 ${asset.astSymbol}`,
      balanceUsd: '$0.00',
      price: '$0.00',
      portfolioPercent: '0%'
    }));

    setAssets(mappedAssets);
    setLoading(false);
  }

  const searchAssetsList = (
      assetsList: Asset[],
      query: string
  ): Asset[] => {
    if (!query) return assetsList;

    const lowercaseQuery = query.toLowerCase();
    return assetsList.filter(asset =>
        asset.name.toLowerCase().includes(lowercaseQuery) ||
        asset.symbol.toLowerCase().includes(lowercaseQuery)
    );
  };

  // 정렬 함수
  const sortAssetsList = (
    assetsList: Asset[],
    sortField: SortField,
    direction: 'asc' | 'desc'
  ): Asset[] => {
    return [...assetsList].sort((a, b) => {
      if (sortField === 'name') {
        return direction === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      }
      
      if (sortField === 'balance') {
        const aBalance = parseFloat(a.balanceUsd.replace(/[^\d.-]/g, ''));
        const bBalance = parseFloat(b.balanceUsd.replace(/[^\d.-]/g, ''));
        return direction === 'asc' ? aBalance - bBalance : bBalance - aBalance;
      }
      
      return 0;
    });
  };

  const filteredAssets = sortAssetsList(
    searchAssetsList(assets, searchTerm),
    sortBy,
    sortDirection
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (field?: SortField) => {
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

  // 자산 생성 핸들러
  const handleCreateWallet = () => {
    // 지갑 생성 페이지로 이동
    router.push('/wallet/create');
  };

  const handleDeposit = (asset: Asset) => {
    setSnackbar({
      open: true,
      message: `${asset.name} deposit feature is coming soon.`,
      severity: 'info'
    });
  };

  const handleWithdraw = (asset: Asset) => {
    setSnackbar({
      open: true,
      message: `${asset.name} withdrawal feature is coming soon.`,
      severity: 'info'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
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
        {/* 스낵바 알림 */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* 자산 목록 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Assets
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 검색 필드 */}
            <TextField
              placeholder="Search assets..."
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
                <MenuItem onClick={() => handleClose('name')}>Name</MenuItem>
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
        {/* 자산 테이블 */}
        {!loading && (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: gray[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Asset</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Balance</TableCell>
                  <TableCell sx={{ width: '200px' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm ? 'No search results found.' : 'No assets found.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: (theme) => 
                            theme.palette.mode === 'dark' ? gray[800] : gray[50] 
                        },
                        '& td': { py: 2 } 
                      }}
                    >
                      {/* 자산 정보 */}
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            cursor: 'pointer', // 포인터 커서 추가
                            '&:hover': { 
                              '& .asset-name': { 
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }
                          }}
                          onClick={() => window.location.href = `/wallet/asset?symbol=${asset.symbol}&name=${encodeURIComponent(asset.name)}`}
                        >
                          <CoinIcon symbol={asset.symbol} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} className="asset-name">
                              {asset.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {asset.symbol}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {/* 잔액 정보 */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {asset.balance}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {asset.balanceUsd}
                        </Typography>
                      </TableCell>
                      
                      {/* 액션 버튼 */}
                      <TableCell align="right">
                        
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