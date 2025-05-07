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
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import { brand, gray } from '@/theme/themePrimitives';
import { fetchWithAuth } from '@/lib/auth';
import { getWalletById, Wallet } from '@/services/walletService';
import { getAssetById, Asset } from '@/services/assetService';
import { fetchAddresses, Address } from '@/services/addressService';

// API call base URL
const API_BASE_URL = 'http://localhost:8080';

// Price data mapping (should be fetched from a separate API in real implementation)
const priceData: Record<string, {price: string, change24h: string}> = {
  'BTC': { price: '$97,322.81', change24h: '+1.2%' },
  'ETH': { price: '$1,827.29', change24h: '-0.5%' },
  'USDT': { price: '$1.00', change24h: '0.0%' },
  'BNB': { price: '$594.90', change24h: '+0.8%' },
  'SOL': { price: '$145.42', change24h: '+3.2%' },
  'USD': { price: '$1.00', change24h: '0.0%' }
};

// Styled components
const InfoCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`,
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: theme.spacing(2),
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '14px',
  fontWeight: 400,
}));

const InfoValue = styled(Typography)(() => ({
  fontSize: '16px',
  fontWeight: 500,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 2),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '14px',
}));

// Wallet icon component
const WalletIcon = styled('div')(() => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: brand[100],
  color: brand[600],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '24px',
}));

// Cryptocurrency icon component
const CoinIcon = styled('div')(() => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: '#F7931A20',
  color: '#F7931A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '20px',
}));

// Balance API response type
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

// Transaction API response type
interface ApiTransaction {
  trxNum: number;
  trxHash: string;
  trxType: string;
  trxAmount: number;
  trxFee: number;
  trxStatus: string;
  trxConfirmedAt: string;
  trxMemo: string;
  walId: number;
  astId: number;
  creusr: number;
  credat: string;
  cretim: string;
  active: string;
}

interface WalletWithDetails extends Wallet {
  asset?: Asset;
  addresses: Address[];
  balance: number;
  balanceUsd: string;
  formattedId?: string;
  formattedDate?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `wallet-tab-${index}`,
    'aria-controls': `wallet-tabpanel-${index}`,
  };
}

export default function WalletDetail(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletId = searchParams.get('id');
  const assetSymbol = searchParams.get('symbol');
  
  const [walletData, setWalletData] = useState<WalletWithDetails | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get wallet data
  useEffect(() => {
    if (!walletId) {
      router.push('/wallet');
      return;
    }
    
    fetchWalletData(Number(walletId));
  }, [walletId, router]);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  // 트랜잭션 데이터 가져오기
  const fetchTransactions = async (walletId: number) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/transactions/wallet/${walletId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      
      const transactionsData: ApiTransaction[] = await response.json();
      return transactionsData;
    } catch (err) {
      console.error(`Error fetching transactions for wallet ${walletId}:`, err);
      return [];
    }
  };

  // 지갑 데이터 가져오기
  const fetchWalletData = async (walletId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // 지갑 정보 가져오기
      const wallet = await getWalletById(walletId);
      
      if (!wallet) {
        throw new Error(`Wallet with ID ${walletId} not found`);
      }
      
      // 자산 정보 가져오기
      const asset = await getAssetById(wallet.astId);
      
      // 주소 목록 가져오기
      const addresses = await fetchAddresses(walletId);
      
      // 잔액 계산
      let totalConfirmedBalance = 0;
      let totalUsdValue = 0;
      
      if (addresses.length > 0) {
        // 각 주소의 잔액 가져오기
        const balancePromises = addresses.map(addr => fetchBalance(addr.adrNum || 0, wallet.astId));
        const balanceResults = await Promise.all(balancePromises);
        
        // 잔액 합산
        balanceResults.forEach(balanceData => {
          if (balanceData) {
            totalConfirmedBalance += balanceData.balConfirmed;
            
            // USD 가치 계산
            const priceValue = parseFloat(priceData[asset?.astSymbol || 'BTC']?.price.replace('$', '').replace(',', '') || '0');
            const balanceValue = balanceData.balConfirmed * priceValue / Math.pow(10, asset?.astDecimals || 8);
            totalUsdValue += balanceValue;
          }
        });
      }
      
      // 트랜잭션 내역 가져오기
      const transactionsData = await fetchTransactions(walletId);
      setTransactions(transactionsData);
      
      // 지갑 ID 포맷팅 (68144d00471ca4f52d32dc22ae9b5e81 형식)
      const formattedId = `${(wallet.walNum || 0).toString(16).padStart(8, '0')}${(wallet.usiNum || 0).toString(16).padStart(8, '0')}${(wallet.astId).toString(16).padStart(8, '0')}${(wallet.polId).toString(16).padStart(8, '0')}`;
      
      // 생성 날짜 포맷팅 (2025. 5. 2. 오후 1시 41분 36초 GMT+9)
      const creationDate = new Date();
      const formattedDate = creationDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      });
      
      // 지갑 데이터 설정
      setWalletData({
        ...wallet,
        asset,
        addresses,
        balance: totalConfirmedBalance,
        balanceUsd: `$${totalUsdValue.toFixed(2)} USD`,
        formattedId,
        formattedDate,
      });
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('An error occurred while loading wallet data. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // 주소 복사
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 입금 처리 핸들러
  const handleDeposit = () => {
    console.log('Deposit processing');
  };

  // Withdrawal handler
  const handleWithdraw = () => {
    console.log('Withdrawal processing');
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
              router.push('/wallet');
            }}
          >
            Assets
          </Link>
          {assetSymbol && (
            <Link
              underline="hover"
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/wallet/asset?symbol=${assetSymbol}&name=${walletData?.asset?.astName || ''}`);
              }}
            >
              {assetSymbol}
            </Link>
          )}
          <Typography color="text.primary">{walletData?.walName || 'Wallet Details'}</Typography>
        </Breadcrumbs>
        
        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* 로딩 상태 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : walletData ? (
          <>
            {/* 지갑 기본 정보 */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <WalletIcon>
                  {walletData.walName?.charAt(0).toUpperCase() || 'W'}
                </WalletIcon>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {walletData.walName}
                    </Typography>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {walletData.asset?.astName} {walletData.walType} Wallet ID: {walletData.formattedId}
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyToClipboard(walletData.formattedId || '')}
                      sx={{ ml: 0.5 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <Button 
                      size="small" 
                      sx={{ ml: 2, textTransform: 'none', fontWeight: 400 }}
                    >
                      Show Less
                    </Button>
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid sx={{ xs: 12, md: 6 }}>
                  <InfoCard>
                    <CardContent>
                      <InfoItem>
                        <InfoLabel>Signature Protocol</InfoLabel>
                        <InfoValue>{walletData.walProtocol === 'Multisig' ? 'Multisignature' : walletData.walProtocol}</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Your Permissions</InfoLabel>
                        <InfoValue>Admin</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Creation Date</InfoLabel>
                        <InfoValue>{walletData.formattedDate}</InfoValue>
                      </InfoItem>
                    </CardContent>
                  </InfoCard>
                </Grid>
              </Grid>
            </Box>
            
            {/* 탭 네비게이션 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="wallet tabs"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    minWidth: 'auto',
                    mr: 3,
                  }
                }}
              >
                <Tab label="Overview" {...a11yProps(0)} />
                <Tab label="Unspents" {...a11yProps(1)} />
                <Tab label="Addresses" {...a11yProps(2)} />
                <Tab label="Users" {...a11yProps(3)} />
                <Tab label="Whitelist" {...a11yProps(4)} />
                <Tab label="Settings" {...a11yProps(5)} />
              </Tabs>
            </Box>
            
            {/* 탭 내용 */}
            <TabPanel value={tabValue} index={0}>
              {/* 잔액 섹션 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Balances
                </Typography>
                
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: gray[50] }}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              Asset
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                              Balance
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Price
                          </Typography>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CoinIcon>
                              {walletData.asset?.astSymbol?.charAt(0) || 'B'}
                            </CoinIcon>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {walletData.asset?.astName || 'Bitcoin'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {walletData.balance || '0'} {walletData.asset?.astSymbol || 'BTC'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {priceData[walletData.asset?.astSymbol || 'BTC']?.price || '$0.00'} USD
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <ActionButton 
                              variant="outlined" 
                              onClick={handleDeposit}
                              startIcon={<DownloadIcon fontSize="small" />}
                            >
                              Deposit
                            </ActionButton>
                            <ActionButton 
                              variant="outlined" 
                              onClick={handleWithdraw}
                              disabled={walletData.balance === 0}
                              startIcon={<FileUploadIcon fontSize="small" />}
                            >
                              Withdraw
                            </ActionButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              
              {/* 트랜잭션 히스토리 섹션 */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Transaction History
                  </Typography>
                  
                  <TextField
                    placeholder="Search by note, TX hash, or wallet addresses"
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: '8px',
                        backgroundColor: 'background.paper',
                        width: 300,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: (theme) => theme.palette.divider,
                        }
                      }
                    }}
                  />
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
                    Status
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
                    Asset
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
                    Confirmation Date
                  </Button>
                </Box>
                
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: gray[50] }}>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: '50%', 
                                backgroundColor: gray[100],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <ReceiptLongIcon sx={{ color: gray[500] }} />
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                You don&apos;`t have any transactions yet
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Once you have transactions, you can view deposit and withdrawal activity here.
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Get started by making a deposit into your wallet.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.trxNum}>
                            <TableCell>{transaction.trxType}</TableCell>
                            <TableCell>{transaction.trxAmount} {walletData.asset?.astSymbol || 'BTC'}</TableCell>
                            <TableCell>{transaction.trxMemo}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography variant="body1">
                Unspents tab content.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="body1">
                Addresses tab content.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <Typography variant="body1">
                Users tab content.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <Typography variant="body1">
                Whitelist tab content.
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={5}>
              <Typography variant="body1">
                Settings tab content.
              </Typography>
            </TabPanel>
          </>
        ) : (
          <Alert severity="error">
            Wallet information not found.
          </Alert>
        )}
      </Container>
    </AppTheme>
  );
}