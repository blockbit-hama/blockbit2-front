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
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';

import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import { brand, gray, green, red } from '@/theme/themePrimitives';
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
}

// 주소 API 응답 타입
interface ApiAddress {
  adrNum: number;
  adrAddress: string;
  adrLabel: string;
  adrType: string;
  adrPath: string;
  walId: number;
  astId: number;
  active: string;
}

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
  wallets?: ApiWallet[]; // 자산에 연결된 지갑 배열로 변경
}

// 정렬 필드 타입
type SortField = 'name' | 'balance' | 'price' | 'portfolioPercent';

// 가격 데이터 매핑 (실제로는 별도 API에서 가져와야 함)
const priceData: Record<string, {price: string, change24h: string}> = {
  'BTC': { price: '$95,563.72', change24h: '+1.2%' },
  'ETH': { price: '$1,827.29', change24h: '-0.5%' },
  'USDT': { price: '$1.00', change24h: '0.0%' },
  'BNB': { price: '$594.90', change24h: '+0.8%' },
  'SOL': { price: '$145.42', change24h: '+3.2%' },
  'USD': { price: '$1.00', change24h: '0.0%' }
};

// API 호출 베이스 URL
const API_BASE_URL = 'http://localhost:8080';

// 스타일링된 컴포넌트
const AssetAvatar = styled(Avatar)(() => ({
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
  
  useEffect(() => {
    fetchAssets();
  }, []);

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

  // 주소 데이터 가져오기
  const fetchAddresses = async (walletId: number) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/addresses/wallet/${walletId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses: ${response.status}`);
      }
      
      const addressData: ApiAddress[] = await response.json();
      return addressData;
    } catch (err) {
      console.error(`Error fetching addresses for wallet ${walletId}:`, err);
      return [];
    }
  };

  // 잔액 데이터 가져오기
  const fetchBalance = async (addressId: number, assetId: number) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/balances/address/${addressId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status}`);
      }
      
      const balanceDataArray: ApiBalance[] = await response.json();
      
      if (balanceDataArray.length === 0) {
        throw new Error(`No balance data found for address ID ${addressId}`);
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
      
      // 주소 데이터 가져오기 - 모든 지갑의 주소를 불러옴
      const addressesPromises = walletData.map(wallet => fetchAddresses(wallet.walNum));
      const addressesResults = await Promise.all(addressesPromises);
      const allAddresses = addressesResults.flat();
      
      // 자산 정보 매핑 및 계산
      const mappedAssets = await Promise.all(
        apiAssets.map(async (apiAsset) => {
          // 이 자산과 관련된 모든 지갑 찾기 (1:N)
          const relatedWallets = walletData.filter(wallet => wallet.astId === apiAsset.astNum);
          
          // 기본 자산 정보 설정
          const asset: Asset = {
            id: apiAsset.astNum,
            name: apiAsset.astName,
            symbol: apiAsset.astSymbol,
            balance: `0 ${apiAsset.astSymbol}`,
            balanceUsd: '$0.00 USD',
            price: `${priceData[apiAsset.astSymbol]?.price || '$0.00'} USD`,
            portfolioPercent: '0%',
            type: apiAsset.astType,
            network: apiAsset.astNetwork,
            decimals: apiAsset.astDecimals,
            wallets: relatedWallets
          };
          
          // 잔액 계산
          if (relatedWallets.length > 0) {
            // 이 자산에 관련된 모든 주소 찾기
            const relatedAddresses = allAddresses.filter(addr => {
              // 자산 ID가 일치하고 이 자산과 관련된 지갑에 속하는 주소인지 확인
              return addr.astId === apiAsset.astNum && relatedWallets.some(wallet => wallet.walNum === addr.walId);
            });
            
            if (relatedAddresses.length > 0) {
              // 모든 주소의 잔액 데이터를 가져와서 합산
              let totalConfirmedBalance = 0;
              let totalUsdValue = 0;
              
              // 각 주소에 대한 잔액 가져오기
              const balancePromises = relatedAddresses.map(addr => fetchBalance(addr.adrNum, apiAsset.astNum));
              const balanceResults = await Promise.all(balancePromises);
              
              // 잔액 합산
              balanceResults.forEach(balanceData => {
                if (balanceData) {
                  totalConfirmedBalance += balanceData.balConfirmed;
                  
                  // USD 가치 계산
                  const priceValue = parseFloat(priceData[apiAsset.astSymbol]?.price.replace('$', '').replace(',', '') || '0');
                  const balanceValue = balanceData.balConfirmed * priceValue / Math.pow(10, apiAsset.astDecimals);
                  totalUsdValue += balanceValue;
                }
              });
              
              // 포맷팅된 잔액 설정
              const formattedBalance = totalConfirmedBalance.toString();
              asset.balance = `${formattedBalance} ${apiAsset.astSymbol}`;
              asset.balanceUsd = `$${totalUsdValue.toFixed(2)} USD`;
            }
          }
          
          return asset;
        })
      );
      
      setAssets(mappedAssets);
      
      // 총 자산 가치 계산
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
    // 각 자산의 USD 가치를 합산
    const total = assetList.reduce((sum, asset) => {
      const balanceUsdValue = parseFloat(asset.balanceUsd.replace('$', '').replace(',', '').split(' ')[0] || '0');
      return sum + balanceUsdValue;
    }, 0);
    
    // 포트폴리오 비율 업데이트
    const assetsWithPortfolioPercent = assetList.map(asset => {
      const balanceUsdValue = parseFloat(asset.balanceUsd.replace('$', '').replace(',', '').split(' ')[0] || '0');
      const percent = total > 0 ? (balanceUsdValue / total) * 100 : 0;
      return {
        ...asset,
        portfolioPercent: `${percent.toFixed(1)}%`
      };
    });
    
    setAssets(assetsWithPortfolioPercent);
    setTotalBalance(`$${total.toFixed(2)} USD`);
  };

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
      
      if (sortField === 'price') {
        const aPrice = parseFloat(a.price.replace(/[^\d.-]/g, ''));
        const bPrice = parseFloat(b.price.replace(/[^\d.-]/g, ''));
        return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      }
      
      if (sortField === 'balance') {
        const aBalance = parseFloat(a.balanceUsd.replace(/[^\d.-]/g, ''));
        const bBalance = parseFloat(b.balanceUsd.replace(/[^\d.-]/g, ''));
        return direction === 'asc' ? aBalance - bBalance : bBalance - aBalance;
      }
      
      if (sortField === 'portfolioPercent') {
        const aPercent = parseFloat(a.portfolioPercent.replace('%', ''));
        const bPercent = parseFloat(b.portfolioPercent.replace('%', ''));
        return direction === 'asc' ? aPercent - bPercent : bPercent - aPercent;
      }
      
      return 0;
    });
  };

  // 검색 함수
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
  
  // 검색 및 정렬이 적용된 자산 목록
  const filteredAssets = sortAssetsList(
    searchAssetsList(assets, searchTerm),
    sortBy,
    sortDirection
  );

  // 주소 복사 핸들러 제거 (사용되지 않음)

  // 자산 생성 핸들러
  const handleCreateWallet = () => {
    // 지갑 생성 페이지로 이동
    window.location.href = '/wallet/create';
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
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                              {asset.symbol} • {asset.network}
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
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: priceData[asset.symbol]?.change24h.includes('+') 
                              ? green[600]
                              : priceData[asset.symbol]?.change24h.includes('-')
                                ? red[600]
                                : 'text.secondary'
                          }}
                        >
                          {priceData[asset.symbol]?.change24h || '0.0%'} (24h)
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
                            onClick={() => handleDeposit(asset)}
                          >
                            Deposit
                          </ActionButton>
                          <ActionButton 
                            variant="outlined" 
                            onClick={() => handleWithdraw(asset)}
                            disabled={asset.balance === `0 ${asset.symbol}`}
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