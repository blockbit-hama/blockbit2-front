"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';

// 아이콘
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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

// 지갑 타입 정의
interface WalletType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// API 호출 베이스 URL
const API_BASE_URL = 'http://localhost:8080';

// 스타일링된 컴포넌트
const WalletTypeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: '1px solid',
  borderColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const TypeIcon = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
}));

// 지갑 유형 목록
const walletTypes: WalletType[] = [
  {
    id: 'Self-custody Hot',
    name: 'Self-Custody',
    description: 'Most flexible - You manage the user and backup keys. BitGo manages the BitGo key. Key creation and transaction signing occur online. Signing requires a password.',
    icon: <TypeIcon>SC</TypeIcon>
  },
  {
    id: 'Cold',
    name: 'Cold Wallet',
    description: 'Highest security - You manage all keys. Keys are created and stored offline. Transactions are signed offline.',
    icon: <TypeIcon>C</TypeIcon>
  },
  {
    id: 'Trading',
    name: 'Trading Wallet',
    description: 'Best for exchanges - BitGo manages all keys. Transactions can be automated for trading platforms.',
    icon: <TypeIcon>T</TypeIcon>
  }
];

export default function CreateWallet(props: { disableCustomTheme?: boolean }) {
  const [assets, setAssets] = useState<ApiAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<number | ''>('');
  const [selectedWalletType, setSelectedWalletType] = useState<string>('Self-custody Hot');
  const [walletName, setWalletName] = useState<string>('');
  const [walletPassword, setWalletPassword] = useState<string>('');
  const [walletPasswordConfirm, setWalletPasswordConfirm] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const router = useRouter();
  
  // 유효성 검사 상태
  const [walletNameError, setWalletNameError] = useState<string>('');
  const [assetError, setAssetError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordConfirmError, setPasswordConfirmError] = useState<string>('');

  // API에서 자산 데이터 가져오기
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const assetData: ApiAsset[] = await response.json();
      setAssets(assetData);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('자산 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 자산 데이터 로드
  useEffect(() => {
    fetchAssets();
  }, []);

  // 지갑 유형 선택 핸들러
  const handleWalletTypeSelect = (walletTypeId: string) => {
    setSelectedWalletType(walletTypeId);
  };

  // 자산 선택 핸들러
  const handleAssetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAsset(Number(event.target.value));
    setAssetError('');
  };

  // 지갑 이름 변경 핸들러
  const handleWalletNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWalletName(event.target.value);
    setWalletNameError('');
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWalletPassword(event.target.value);
    setPasswordError('');
    
    if (walletPasswordConfirm && event.target.value !== walletPasswordConfirm) {
      setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordConfirmError('');
    }
  };

  // 비밀번호 확인 변경 핸들러
  const handlePasswordConfirmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWalletPasswordConfirm(event.target.value);
    
    if (event.target.value !== walletPassword) {
      setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordConfirmError('');
    }
  };

  // 비밀번호 표시 토글 핸들러
  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    let isValid = true;
    
    // 지갑 이름 검사
    if (!walletName.trim()) {
      setWalletNameError('지갑 이름을 입력해주세요.');
      isValid = false;
    } else if (walletName.length < 3) {
      setWalletNameError('지갑 이름은 최소 3자 이상이어야 합니다.');
      isValid = false;
    }
    
    // 자산 선택 검사
    if (!selectedAsset) {
      setAssetError('자산을 선택해주세요.');
      isValid = false;
    }
    
    // 비밀번호 검사 (Self-custody 지갑인 경우만)
    if (selectedWalletType === 'Self-custody Hot') {
      if (!walletPassword) {
        setPasswordError('비밀번호를 입력해주세요.');
        isValid = false;
      } else if (walletPassword.length < 8) {
        setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
        isValid = false;
      }
      
      if (!walletPasswordConfirm) {
        setPasswordConfirmError('비밀번호 확인을 입력해주세요.');
        isValid = false;
      } else if (walletPassword !== walletPasswordConfirm) {
        setPasswordConfirmError('비밀번호가 일치하지 않습니다.');
        isValid = false;
      }
    }
    
    return isValid;
  };

  // 지갑 생성 제출 핸들러
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User ID not found. Please log in.');
      }
      
      // 지갑 생성 API 요청 데이터
      const walletData = {
        walName: walletName,
        walType: selectedWalletType,
        walProtocol: "MPC", // 기본값으로 설정
        walPwd: selectedWalletType === 'Self-custody Hot' ? walletPassword : "",
        walStatus: "active",
        usiNum: userId,
        astId: selectedAsset,
        polId: 1 // 기본값으로 설정
      };
      
      // 지갑 생성 API 호출
      const response = await fetchWithAuth(`${API_BASE_URL}/api/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walletData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create wallet: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // 성공 시 처리
      setSnackbar({
        open: true,
        message: '지갑이 성공적으로 생성되었습니다.',
        severity: 'success'
      });
      
      // 잠시 후 지갑 목록 페이지로 이동
      setTimeout(() => {
        router.push('/wallet');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating wallet:', err);
      setSnackbar({
        open: true,
        message: `지갑 생성 중 오류가 발생했습니다: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
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
        
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={() => router.back()}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Wallet Create
          </Typography>
        </Box>
        
        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        {/* 로딩 상태 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                  Wallet Details
                </Typography>
                
                {/* 지갑 이름 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Name
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Example: Mike's BTC Wallet"
                    value={walletName}
                    onChange={handleWalletNameChange}
                    error={!!walletNameError}
                    helperText={walletNameError}
                    disabled={submitting}
                  />
                </Box>
                
                {/* 자산 선택 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Asset
                  </Typography>
                  <FormControl fullWidth error={!!assetError}>
                    <Select
                      value={selectedAsset}
                      onChange={handleAssetChange as any}
                      displayEmpty
                      disabled={submitting}
                      renderValue={(selected) => {
                        if (!selected) {
                          return <Typography color="text.secondary">Type</Typography>;
                        }
                        
                        const asset = assets.find(a => a.astNum === selected);
                        if (!asset) return '';
                        
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                mr: 1, 
                                bgcolor: asset.astSymbol === 'BTC' ? '#F7931A20' : brand[100],
                                color: asset.astSymbol === 'BTC' ? '#F7931A' : brand[700],
                                fontSize: '12px'
                              }}
                            >
                              {asset.astSymbol.charAt(0)}
                            </Avatar>
                            <Typography>{asset.astName}</Typography>
                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                              {asset.astSymbol}
                            </Typography>
                          </Box>
                        );
                      }}
                    >
                      {assets.map((asset) => (
                        <MenuItem key={asset.astNum} value={asset.astNum}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24, 
                                  mr: 1, 
                                  bgcolor: asset.astSymbol === 'BTC' ? '#F7931A20' : 
                                          asset.astSymbol === 'ETH' ? '#62688F20' :
                                          asset.astSymbol === 'SOL' ? '#00FFBD20' :
                                          brand[100],
                                  color: asset.astSymbol === 'BTC' ? '#F7931A' : 
                                         asset.astSymbol === 'ETH' ? '#62688F' :
                                         asset.astSymbol === 'SOL' ? '#00FFBD' :
                                         brand[700],
                                  fontSize: '12px'
                                }}
                              >
                                {asset.astSymbol.charAt(0)}
                              </Avatar>
                              <Typography>{asset.astName}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {asset.astSymbol}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {assetError && <FormHelperText>{assetError}</FormHelperText>}
                  </FormControl>
                </Box>
                
                {/* 지갑 유형 */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                    Wallet Type
                  </Typography>
                  
                  {walletTypes.map((type) => (
                    <WalletTypeCard
                      key={type.id}
                      onClick={() => handleWalletTypeSelect(type.id)}
                      elevation={selectedWalletType === type.id ? 2 : 0}
                      sx={{
                        borderColor: selectedWalletType === type.id ? 'primary.main' : 'transparent',
                      }}
                    >
                      <Radio
                        checked={selectedWalletType === type.id}
                        onChange={() => handleWalletTypeSelect(type.id)}
                        disabled={submitting}
                      />
                      {type.icon}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {type.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </WalletTypeCard>
                  ))}
                </Box>
                
                {/* 비밀번호 (Self-custody 지갑인 경우만) */}
                {selectedWalletType === 'Self-custody Hot' && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 500 }}>
                      Wallet Password
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth variant="outlined" error={!!passwordError}>
                        <InputLabel htmlFor="wallet-password">Password</InputLabel>
                        <OutlinedInput
                          id="wallet-password"
                          type={showPassword ? 'text' : 'password'}
                          value={walletPassword}
                          onChange={handlePasswordChange}
                          disabled={submitting}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleToggleShowPassword}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          }
                          label="Password"
                        />
                        {passwordError && <FormHelperText>{passwordError}</FormHelperText>}
                      </FormControl>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth variant="outlined" error={!!passwordConfirmError}>
                        <InputLabel htmlFor="wallet-password-confirm">Password Check</InputLabel>
                        <OutlinedInput
                          id="wallet-password-confirm"
                          type={showPassword ? 'text' : 'password'}
                          value={walletPasswordConfirm}
                          onChange={handlePasswordConfirmChange}
                          disabled={submitting}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleToggleShowPassword}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          }
                          label="Password Check"
                        />
                        {passwordConfirmError && <FormHelperText>{passwordConfirmError}</FormHelperText>}
                      </FormControl>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            {/* 제출 버튼 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                endIcon={submitting ? <CircularProgress size={20} /> : undefined}
              >
                {submitting ? 'Submitting..' : 'Create'}
              </Button>
            </Box>
          </form>
        )}
      </Container>
    </AppTheme>
  );
}
