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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';

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
import { getAssetById, Asset } from '@/services/assetService';
import { API_BASE_URL } from '@/config/environment';
import { getWalletById, getWalletUsersList, createBitcoinTransaction, completeBitcoinTransaction } from '@/services/walletsService';
import { Wallet } from '@/services/walletsService';
import { getWalletAddressesByWallet, WalletAddress } from '@/services/walletAddressesService';
import { getTransactionsByWallet, Transaction } from '@/services/transactionsService';
import { getUserInfoList, UserInfo } from '@/services/userInfoService';
import { getUserId } from '@/lib/auth';
import { addUserToWallet as addUserToWalletService, removeUserFromWallet, WalletRole } from '@/services/walUsiMappService';
import QRCode from 'react-qr-code';

const priceData: Record<string, {price: string, change24h: string}> = {
  'BTC': { price: '0', change24h: '0' },
  'ETH': { price: '0', change24h: '0' }
};

interface WalletWithDetails extends Wallet {
  asset?: Asset;
  addresses: WalletAddress[];
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

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 2),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '14px',
}));

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

export default function WalletDetail(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetSymbol = searchParams.get('symbol');
  const walletId = searchParams.get('id');
  const [walletData, setWalletData] = useState<WalletWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionDialog, setTransactionDialog] = useState<{
    open: boolean;
    type: 'deposit' | 'withdraw';
  }>({
    open: false,
    type: 'deposit'
  });
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
  const [deleteUsers, setDeleteUsers] = useState<UserInfo[]>([]);
  const [deleteUsersLoading, setDeleteUsersLoading] = useState(false);
  const [deleteUsersError, setDeleteUsersError] = useState<string | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    toAddress: '',
    amount: '',
    privateKey: '',
  });
  const [transactionDetailModalOpen, setTransactionDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionPrivateKey, setTransactionPrivateKey] = useState('');

  const walletNum = React.useMemo(() => {
    const n = Number(walletId);
    return isNaN(n) ? undefined : n;
  }, [walletId]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (tabValue === 3) {
      setUsersLoading(true);
      getWalletUsersList(parseInt(walletId || '0'))
        .then(setUsers)
        .catch(() => setUsersError('유저 목록을 불러오지 못했습니다.'))
        .finally(() => setUsersLoading(false));
    }
  }, [tabValue]);

  const init = async () => {
    try {
      fetchWalletData(Number(walletId));
    } catch (error) {

    }
  }

  const fetchWalletData = async (walletId: number) => {
    setLoading(true);
    
    try {
      // 지갑 정보 가져오기
      const wallet = await getWalletById(walletId);
      
      if (!wallet) {
        throw new Error(`Wallet with ID ${walletId} not found`);
      }
      
      // 자산 정보 가져오기
      const asset = await getAssetById(wallet.astNum || 0);
      
      // 주소 목록 가져오기
      const addresses = await getWalletAddressesByWallet(walletId);
      
      // 잔액 계산
      let totalConfirmedBalance = 0;
      let totalUsdValue = 0;
      
      if (addresses.length > 0) {
        // 각 주소의 잔액 가져오기
        // const balancePromises = addresses.map(addr => fetchBalance(addr.adrNum || 0, wallet.astId));
        // const balanceResults = await Promise.all(balancePromises);
        
        // 잔액 합산
        // balanceResults.forEach(balanceData => {
        //   if (balanceData) {
        //     totalConfirmedBalance += balanceData.balConfirmed;
        //     
        //     // USD 가치 계산
        //     const priceValue = parseFloat(priceData[asset?.astSymbol || 'BTC']?.price.replace('$', '').replace(',', '') || '0');
        //     const balanceValue = balanceData.balConfirmed * priceValue / Math.pow(10, asset?.astDecimals || 8);
        //     totalUsdValue += balanceValue;
        //   }
        // });
      }
      
      // 트랜잭션 내역 가져오기
      const transactionsData = await getTransactionsByWallet(walletId);
      setTransactions(transactionsData);

      // 지갑 ID 포맷팅 (68144d00471ca4f52d32dc22ae9b5e81 형식)
      const formattedId = addresses[0].wadAddress;
      
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
    } finally {
      setLoading(false);
    }
  };

  function a11yProps(index: number) {
    return {
      id: `wallet-tab-${index}`,
      'aria-controls': `wallet-tabpanel-${index}`,
    };
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeposit = () => {
    setDepositModalOpen(true);
  };

  const handleWithdraw = () => {
    setWithdrawModalOpen(true);
  };

  const handleOpenAddUserModal = async () => {
    setAddUserModalOpen(true);
    setAllUsersLoading(true);
    setAllUsersError(null);
    try {
      const allUserList = await getUserInfoList();
      const myUsiNum = getUserId();
      setAllUsers(allUserList.filter(u => u.usiNum !== myUsiNum));
    } catch {
      setAllUsersError('유저 목록을 불러오지 못했습니다.');
    } finally {
      setAllUsersLoading(false);
    }
  };

  const handleCloseAddUserModal = () => {
    setAddUserModalOpen(false);
  };

  const addUserToWallet = async (usiNum: number, walNum: number, wum_role: WalletRole = 'viewer') => {
    await addUserToWalletService(usiNum, walNum, wum_role);
    // TODO: 성공 시 피드백/리로드 등 추가 가능
  };

  const handleOpenDeleteUserModal = async () => {
    setDeleteUserModalOpen(true);
    setDeleteUsersLoading(true);
    setDeleteUsersError(null);
    try {
      if (walletNum !== undefined) {
        const users = await getWalletUsersList(walletNum);
        const myUsiNum = getUserId();
        setDeleteUsers(users.filter(u => u.usiNum !== myUsiNum));
      }
    } catch {
      setDeleteUsersError('유저 목록을 불러오지 못했습니다.');
    } finally {
      setDeleteUsersLoading(false);
    }
  };

  const handleCloseDeleteUserModal = () => {
    setDeleteUserModalOpen(false);
  };

  const handleDeleteUser = async (usiNum: number) => {
    if (walletNum !== undefined) {
      await removeUserFromWallet(usiNum, walletNum);
      handleCloseDeleteUserModal();
    }
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false);
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  const handleWithdrawFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWithdrawForm({ ...withdrawForm, [e.target.name]: e.target.value });
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawForm.toAddress || !withdrawForm.amount || !withdrawForm.privateKey) return;
    if (walletNum === undefined) return;
    try {
      const result = await createBitcoinTransaction({
        toAddress: withdrawForm.toAddress,
        privateKeyHex: withdrawForm.privateKey,
        amountSatoshi: Number(withdrawForm.amount),
        wadNum: walletNum,
        walNum: walletNum,
      });
      console.log('Withdraw result:', result);
    } catch (err) {
      console.error('Withdraw error:', err);
    }
    setWithdrawModalOpen(false);
  };

  const handleTransactionRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionDetailModalOpen(true);
  };

  const handleCloseTransactionDetailModal = () => {
    setTransactionDetailModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleAcceptTransaction = async () => {
    if (!selectedTransaction || !transactionPrivateKey) return;
    try {
      const result = await completeBitcoinTransaction({
        trxNum: selectedTransaction.trxNum,
        privateKeyHex: transactionPrivateKey,
      });
      console.log('Transaction complete result:', result);
    } catch (err) {
      console.error('Transaction complete error:', err);
    }
    setTransactionDetailModalOpen(false);
    setTransactionPrivateKey('');
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
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Trx ID</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>To Address</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Fee</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
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
                                You don&apos;t have any transactions yet
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
                          <TableRow key={transaction.trxNum} hover style={{ cursor: 'pointer' }}
                            onClick={() => handleTransactionRowClick(transaction)}
                          >
                            <TableCell>{transaction.trxTxId}</TableCell>
                            <TableCell>{transaction.trxToAddr}</TableCell>
                            <TableCell>{transaction.trxAmount}</TableCell>
                            <TableCell>{transaction.trxFee}</TableCell>
                            <TableCell>{transaction.trxStatus}</TableCell>
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                <Button variant="contained" onClick={handleOpenAddUserModal}>
                  Add User
                </Button>
                <Button variant="outlined" color="error" onClick={handleOpenDeleteUserModal}>
                  Delete User
                </Button>
              </Box>
              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : usersError ? (
                <Alert severity="error">{usersError}</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: gray[50] }}>
                        <TableCell sx={{ fontWeight: 600 }}>No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            가입된 유저가 없습니다.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map(user => (
                          <TableRow key={user.usiNum}>
                            <TableCell>{user.usiNum}</TableCell>
                            <TableCell>{user.usiId}</TableCell>
                            <TableCell>{user.usiName}</TableCell>
                            <TableCell>{user.usiEmail}</TableCell>
                            <TableCell>{user.usiPhoneNum}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {/* Add User Modal */}
              <Dialog open={addUserModalOpen} onClose={handleCloseAddUserModal} maxWidth="sm" fullWidth>
                <DialogTitle>Add User</DialogTitle>
                <DialogContent>
                  {allUsersLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : allUsersError ? (
                    <Alert severity="error">{allUsersError}</Alert>
                  ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: gray[50] }}>
                            <TableCell>No</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                추가 가능한 유저가 없습니다.
                              </TableCell>
                            </TableRow>
                          ) : (
                            allUsers.map(user => (
                              <TableRow key={user.usiNum} hover style={{ cursor: 'pointer' }}
                                onClick={async () => {
                                  if (walletNum !== undefined) {
                                    await addUserToWallet(user.usiNum || 0, walletNum, 'viewer');
                                    handleCloseAddUserModal();
                                  }
                                }}
                              >
                                <TableCell>{user.usiNum}</TableCell>
                                <TableCell>{user.usiId}</TableCell>
                                <TableCell>{user.usiName}</TableCell>
                                <TableCell>{user.usiEmail}</TableCell>
                                <TableCell>{user.usiPhoneNum}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseAddUserModal}>Close</Button>
                </DialogActions>
              </Dialog>
              {/* Delete User Modal */}
              <Dialog open={deleteUserModalOpen} onClose={handleCloseDeleteUserModal} maxWidth="sm" fullWidth>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                  {deleteUsersLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : deleteUsersError ? (
                    <Alert severity="error">{deleteUsersError}</Alert>
                  ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${gray[200]}` }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: gray[50] }}>
                            <TableCell>No</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deleteUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                삭제 가능한 유저가 없습니다.
                              </TableCell>
                            </TableRow>
                          ) : (
                            deleteUsers.map(user => (
                              <TableRow key={user.usiNum} hover style={{ cursor: 'pointer' }}
                                onClick={async () => await handleDeleteUser(user.usiNum || 0)}
                              >
                                <TableCell>{user.usiNum}</TableCell>
                                <TableCell>{user.usiId}</TableCell>
                                <TableCell>{user.usiName}</TableCell>
                                <TableCell>{user.usiEmail}</TableCell>
                                <TableCell>{user.usiPhoneNum}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDeleteUserModal}>Close</Button>
                </DialogActions>
              </Dialog>
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
        {/* Deposit Modal */}
        <Dialog open={depositModalOpen} onClose={handleCloseDepositModal} maxWidth="xs" fullWidth>
          <DialogTitle>Deposit QR Code</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <QRCode value="https://example.com/deposit" size={180} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Scan this QR code to deposit.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDepositModal}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* Withdraw Modal */}
        <Dialog open={withdrawModalOpen} onClose={handleCloseWithdrawModal} maxWidth="xs" fullWidth>
          <DialogTitle>Withdraw</DialogTitle>
          <form onSubmit={handleWithdrawSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              <TextField
                label="To Address"
                name="toAddress"
                value={withdrawForm.toAddress}
                onChange={handleWithdrawFormChange}
                fullWidth
                required
              />
              <TextField
                label="Amount"
                name="amount"
                value={withdrawForm.amount}
                onChange={handleWithdrawFormChange}
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: 'any' }}
              />
              <TextField
                label="Private Key"
                name="privateKey"
                value={withdrawForm.privateKey}
                onChange={handleWithdrawFormChange}
                fullWidth
                required
                type="password"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseWithdrawModal}>Close</Button>
              <Button type="submit" variant="contained">Submit</Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* Transaction Detail Modal */}
        <Dialog open={transactionDetailModalOpen} onClose={handleCloseTransactionDetailModal} maxWidth="xs" fullWidth>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            {selectedTransaction && (
              <>
                <Typography><b>To Address:</b> {selectedTransaction.trxToAddr}</Typography>
                <Typography><b>Amount:</b> {selectedTransaction.trxAmount}</Typography>
                <Typography><b>Fee:</b> {selectedTransaction.trxFee}</Typography>
                <TextField
                  label="Private Key"
                  type="password"
                  value={transactionPrivateKey}
                  onChange={e => setTransactionPrivateKey(e.target.value)}
                  fullWidth
                  required
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDetailModal}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleAcceptTransaction} disabled={!transactionPrivateKey}>Accept</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppTheme>
  );
}