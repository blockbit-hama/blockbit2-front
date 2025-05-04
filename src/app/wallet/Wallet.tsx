"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

// 아이콘
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';

import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import { brand, gray } from '@/theme/themePrimitives';
import { fetchWithAuth, getUserId } from '@/lib/auth';

// API 응답 타입 정의
interface ApiAsset {
  astNum: number;
  astName: string;
  astSymbol: string;
  astType: string;
  astNetwork: string;
  astDecimals: number;
  active: string;
}

// 지갑 API 응답 타입
interface ApiWallet {
  walNum: number;
  walName: string;
  walType: string;
  walProtocol: string;
  walStatus: string;
  usiNum: number;
  astId: number;
  polId: number;
  active: string;
  balance?: string; // 실제 API에는 없지만, 예시로 추가
}

// 자산 인터페이스
interface Asset {
  id: number;
  name: string;
  symbol: string;
  balance: string;
  balanceUsd: string;
  price: string;
  portfolioPercent: string;
  type?: string;
  network?: string;
  decimals?: number;
  walletId?: number;
}

// 정렬 필드 타입
type SortField = 'name' | 'balance' | 'price' | 'portfolioPercent';

// 가격 데이터 매핑 (실제로는 별도 API에서 가져와야 함)
const priceData: Record<string, string> = {
  'BTC': '$95,563.72 USD',
  'ETH': '$1,827.29 USD',
  'USDT': '$1.00 USD',
  'BNB': '$594.90 USD',
  'SOL': '$145.42 USD',
  'USD': '$1.00 USD'
};

// API에서 가져온 데이터를 Asset 형식으로 변환하는 함수
const mapApiAssetToAsset = (apiAsset: ApiAsset, wallets: ApiWallet[]): Asset => {
  // 해당 자산에 관련된 지갑 찾기
  const relatedWallet = wallets.find(wallet => wallet.astId === apiAsset.astNum);
  
  return {
    id: apiAsset.astNum,
    name: apiAsset.astName,
    symbol: apiAsset.astSymbol,
    balance: relatedWallet ? `0 ${apiAsset.astSymbol}` : `0 ${apiAsset.astSymbol}`, // 실제 잔액은 지갑 API에서 가져와야 함
    balanceUsd: '$0.00 USD', // 실제 USD 가치는 별도 계산 필요
    price: priceData[apiAsset.astSymbol] || '$0.00 USD',
    portfolioPercent: '0%', // 실제 포트폴리오 비율 계산 필요
    type: apiAsset.astType,
    network: apiAsset.astNetwork,
    decimals: apiAsset.astDecimals,
    walletId: relatedWallet?.walNum
  };
};

// 정렬 함수
const sortAssets = (
  assets: Asset[],
  sortBy: SortField,
  direction: 'asc' | 'desc'
): Asset[] => {
  return [...assets].sort((a, b) => {
    // 이름 정렬
    if (sortBy === 'name') {
      return direction === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    
    // 가격 정렬
    if (sortBy === 'price') {
      const aPrice = parseFloat(a.price.replace(/[^\d.-]/g, ''));
      const bPrice = parseFloat(b.price.replace(/[^\d.-]/g, ''));
      return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    }
    
    // 잔액 정렬
    if (sortBy === 'balance') {
      const aBalance = parseFloat(a.balanceUsd.replace(/[^\d.-]/g, ''));
      const bBalance = parseFloat(b.balanceUsd.replace(/[^\d.-]/g, ''));
      return direction === 'asc' ? aBalance - bBalance : bBalance - aBalance;
    }
    
    // 포트폴리오 비율 정렬
    if (sortBy === 'portfolioPercent') {
      const aPercent = parseFloat(a.portfolioPercent.replace('%', ''));
      const bPercent = parseFloat(b.portfolioPercent.replace('%', ''));
      return direction === 'asc' ? aPercent - bPercent : bPercent - aPercent;
    }
    
    return 0;
  });
};

// 검색 함수
const searchAssets = (
  assets: Asset[],
  query: string
): Asset[] => {
  if (!query) return assets;
  
  const lowercaseQuery = query.toLowerCase();
  return assets.filter(asset => 
    asset.name.toLowerCase().includes(lowercaseQuery) || 
    asset.symbol.toLowerCase().includes(lowercaseQuery)
  );
};

// 스타일링된 컴포넌트
const AssetAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: brand[100],
  color: brand[700],
  fontSize: '14px',
  fontWeight: 'bold',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 2),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '12px',
}));

// 암호화폐 아이콘 컴포넌트
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

// API 호출 베이스 URL
const API_BASE_URL = 'http://localhost:8080';

export default function Wallet(props: { disableCustomTheme?: boolean }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [wallets, setWallets] = useState<ApiWallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalBalance, setTotalBalance] = useState<string>('$0.00 USD');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const open = Boolean(anchorEl);

  // 사용자의 지갑 데이터 가져오기
  const fetchWallets = async () => {
    try {
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const response = await fetchWithAuth(`${API_BASE_URL}/api/wallets/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wallets: ${response.status}`);
      }
      
      const walletData: ApiWallet[] = await response.json();
      setWallets(walletData);
      
      return walletData;
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('지갑 정보를 불러오는 중 오류가 발생했습니다.');
      return [];
    }
  };

  // API에서 자산 데이터 가져오기
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 자산 API 호출
      const assetResponse = await fetch(`${API_BASE_URL}/api/assets`);
      
      if (!assetResponse.ok) {
        throw new Error(`Asset API request failed: ${assetResponse.status}`);
      }
      
      const apiAssets: ApiAsset[] = await assetResponse.json();
      
      // 지갑 데이터 가져오기
      const walletData = await fetchWallets();
      
      // 자산 데이터 매핑
      const mappedAssets = apiAssets.map(apiAsset => mapApiAssetToAsset(apiAsset, walletData));
      
      setAssets(mappedAssets);
      
      // 총 자산 가치 계산 (실제로는 더 복잡한 로직이 필요)
      calculateTotalBalance(mappedAssets);
      
      if (refreshing) {
        setSnackbar({
          open: true,
          message: '자산 목록이 갱신되었습니다.',
          severity: 'success'
        });
        setRefreshing(false);
      }
    } catch (err) {
      console.error('자산 데이터 가져오기 오류:', err);
      setError('자산 데이터를 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인하세요.');
      setRefreshing(false);
    } finally {
      setLoading(false);
    }
  };

  // 총 자산 가치 계산 함수
  const calculateTotalBalance = (assetList: Asset[]) => {
    // 실제로는 각 자산의 USD 가치를 합산하는 로직이 필요
    // 현재는 예시로 0으로 설정
    setTotalBalance('$0.00 USD');
  };

  // 컴포넌트 마운트 시 자산 데이터 로드
  useEffect(() => {
    fetchAssets();
  }, []);

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };
  
  // 정렬 메뉴 열기
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 정렬 메뉴 닫기 및 정렬 적용
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
  
  // 검색어 변경 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  // 검색 및 정렬이 적용된 자산 목록
  const filteredAssets = sortAssets(
    searchAssets(assets, searchTerm),
    sortBy,
    sortDirection
  );

  // 자산 생성 핸들러
  const handleCreateWallet = () => {
    // 실제로는 지갑 생성 모달 또는 페이지로 이동
    setSnackbar({
      open: true,
      message: '지갑 생성 기능은 준비 중입니다.',
      severity: 'info'
    });
  };

  // 입금 처리 핸들러
  const handleDeposit = (asset: Asset) => {
    setSnackbar({
      open: true,
      message: `${asset.name} 입금 기능은 준비 중입니다.`,
      severity: 'info'
    });
  };

  // 출금 처리 핸들러
  const handleWithdraw = (asset: Asset) => {
    setSnackbar({
      open: true,
      message: `${asset.name} 출금 기능은 준비 중입니다.`,
      severity: 'info'
    });
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
        
        {/* 총 자산 가치 영역 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            {totalBalance}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Total value of all your assets
          </Typography>
        </Box>
        
        {/* 자산 테이블 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
            
            {/* 모든 자산 표시 버튼 */}
            <Chip 
              label="Show All Assets" 
              variant="outlined"
              onClick={handleRefresh}
              sx={{ 
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '13px',
                height: '38px',
              }}
            />
            
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
                <MenuItem onClick={() => handleClose('price')}>Price</MenuItem>
                <MenuItem onClick={() => handleClose('portfolioPercent')}>Portfolio %</MenuItem>
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
        
        {/* 자산 테이블 */}
        {!loading && (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: gray[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Asset</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Portfolio %</TableCell>
                  <TableCell sx={{ width: '200px' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm ? '검색 결과가 없습니다.' : '자산이 없습니다.'}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CoinIcon symbol={asset.symbol} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
                      
                      {/* 가격 정보 */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {asset.price}
                        </Typography>
                      </TableCell>
                      
                      {/* 포트폴리오 비율 */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {asset.portfolioPercent}
                        </Typography>
                      </TableCell>
                      
                      {/* 액션 버튼 */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <ActionButton 
                            variant="outlined" 
                            startIcon={<ArrowDropDownIcon />}
                            onClick={() => handleDeposit(asset)}
                          >
                            Deposit
                          </ActionButton>
                          <ActionButton 
                            variant="outlined" 
                            startIcon={<ArrowDropDownIcon />}
                            onClick={() => handleWithdraw(asset)}
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
