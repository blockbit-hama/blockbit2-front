"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import { useRouter } from 'next/navigation';
import { fetchWithAuth, getUserId } from '@/lib/auth';

// API 호출 베이스 URL
const API_BASE_URL = 'http://localhost:8080';

// 서명 프로토콜 카드 컴포넌트 스타일링
const ProtocolCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: '1px solid',
  borderColor: theme.palette.divider,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
    background: theme.palette.action.selected,
  },
}));

const IconWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  width: 48,
  height: 48,
  marginRight: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

// 지갑 생성 단계
const steps = ['지갑 정보', '서명 프로토콜', '비밀번호 설정', '확인'];

export default function CreateWallet(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('Self-custody Hot');
  const [assetType, setAssetType] = useState('Bitcoin');
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [protocolOptions, setProtocolOptions] = useState<string[]>([]);

  // 비밀번호 유효성 검사 상태
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  // 자산 유형에 따라 서명 프로토콜 옵션 설정
  useEffect(() => {
    if (assetType === 'Bitcoin' || assetType === 'Bitcoin Cash' || assetType === 'Litecoin') {
      // 비트코인 계열은 Multisig만 지원
      setProtocolOptions(['Multisig']);
      setSelectedProtocol('Multisig');
    } else if (assetType === 'Ethereum' || assetType === 'ERC-20') {
      // 이더리움 계열은 Multisig와 MPC를 모두 지원
      setProtocolOptions(['Multisig', 'MPC']);
      setSelectedProtocol(''); // 사용자가 선택하도록 초기화
    } else {
      // 기타 자산은 기본값
      setProtocolOptions(['Multisig']);
      setSelectedProtocol('Multisig');
    }
  }, [assetType]);

  // 비밀번호 유효성 검사
  useEffect(() => {
    if (walletPassword) {
      setPasswordErrors({
        length: walletPassword.length < 8,
        uppercase: !/[A-Z]/.test(walletPassword),
        number: !/[0-9]/.test(walletPassword),
        special: !/[!@#$%^&*(),.?":{}|<>]/.test(walletPassword),
      });
    }
  }, [walletPassword]);

  // 비밀번호 유효성 검사 통과 여부
  const isPasswordValid = () => {
    return (
      walletPassword.length >= 8 &&
      /[A-Z]/.test(walletPassword) &&
      /[0-9]/.test(walletPassword) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(walletPassword) &&
      walletPassword === confirmPassword
    );
  };

  // 현재 단계의 입력이 유효한지 확인
  const isStepValid = () => {
    switch (activeStep) {
      case 0: // 지갑 정보
        return walletName.trim() !== '' && walletType !== '' && assetType !== '';
      case 1: // 서명 프로토콜
        return selectedProtocol !== '';
      case 2: // 비밀번호 설정
        return isPasswordValid();
      default:
        return true;
    }
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // 마지막 단계에서는 지갑 생성 API
      handleCreateWallet();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // 지갑 생성 API 호출
  const handleCreateWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      // fetchWithAuth 함수를 사용해 API 호출
      const response = await fetchWithAuth(`${API_BASE_URL}/api/wallets`, {
        method: 'POST',
        body: JSON.stringify({
          walName: walletName,
          walType: walletType,
          walProtocol: selectedProtocol,
          walPwd: walletPassword,
          walStatus: 'active',
          usiNum: getUserId(), // 현재 로그인한 사용자 ID
          astId: getAssetId(assetType), // 선택한 자산 ID
          polId: 1 // 정책 ID
        })
      });
      
      if (!response.ok) {
        throw new Error('지갑 생성에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 지갑 생성 성공 시 지갑 목록 페이지로 이동
      router.push('/wallet');
    } catch (err) {
      console.error('지갑 생성 오류:', err);
      setError('지갑 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 자산 유형에 따른 ID 반환 (임시 구현, 실제로는 API에서 가져온 목록을 사용해야 함)
  const getAssetId = (assetType: string) => {
    const assetMap: {[key: string]: number} = {
      'Bitcoin': 1,
      'Ethereum': 2,
      'Bitcoin Cash': 3,
      'Litecoin': 4,
      'ERC-20': 5
    };
    
    return assetMap[assetType] || 1;
  };

  // 각 단계별 컴포넌트 렌더링
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="지갑 이름"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="예: 비트코인 메인 지갑"
                fullWidth
                required
              />
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="wallet-type-label">지갑 유형</InputLabel>
              <Select
                labelId="wallet-type-label"
                value={walletType}
                onChange={(e) => setWalletType(e.target.value)}
                label="지갑 유형"
                fullWidth
              >
                <MenuItem value="Self-custody Hot">Self-custody Hot</MenuItem>
                <MenuItem value="Cold">Cold</MenuItem>
                <MenuItem value="Trading">Trading</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="asset-type-label">자산 유형</InputLabel>
              <Select
                labelId="asset-type-label"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                label="자산 유형"
                fullWidth
              >
                <MenuItem value="Bitcoin">Bitcoin (BTC)</MenuItem>
                <MenuItem value="Ethereum">Ethereum (ETH)</MenuItem>
                <MenuItem value="Bitcoin Cash">Bitcoin Cash (BCH)</MenuItem>
                <MenuItem value="Litecoin">Litecoin (LTC)</MenuItem>
                <MenuItem value="ERC-20">ERC-20 Tokens</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              서명 프로토콜
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              지갑의 서명 프로토콜을 선택하세요. 지갑 생성 후에는 서명 프로토콜을 변경할 수 없습니다.
              <Link href="#" color="primary" sx={{ ml: 1 }}>
                자세히 알아보기
              </Link>
            </Typography>
            
            {protocolOptions.includes('Multisig') && (
              <ProtocolCard 
                className={selectedProtocol === 'Multisig' ? 'selected' : ''}
                onClick={() => setSelectedProtocol('Multisig')}
                variant="outlined"
              >
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <IconWrapper>
                    <SecurityIcon />
                  </IconWrapper>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      Multisignature (Multisig)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      온체인 암호화 기술로 3개의 키(사용자, 백업, BitGo)를 사용합니다. 각 키는 고유한 공개 키를 가지며, 거래에는 3개 중 2개의 키에서 서명이 필요합니다. 서명은 코사이너 간에 비동기적으로 이루어집니다.
                    </Typography>
                  </Box>
                  {selectedProtocol === 'Multisig' && (
                    <CheckCircleIcon color="primary" sx={{ ml: 2 }} />
                  )}
                </CardContent>
              </ProtocolCard>
            )}
            
            {protocolOptions.includes('MPC') && (
              <ProtocolCard 
                className={selectedProtocol === 'MPC' ? 'selected' : ''}
                onClick={() => setSelectedProtocol('MPC')}
                variant="outlined"
              >
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <IconWrapper>
                    <SecurityIcon />
                  </IconWrapper>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      Multi-Party Computation (MPC)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      여러 당사자가 서로의 비밀 입력을 공개하지 않고 공동으로 계산을 수행하는 암호화 기술입니다. 이더리움 계열 자산에 이상적이며, 더 높은 보안성과 효율성을 제공합니다.
                    </Typography>
                  </Box>
                  {selectedProtocol === 'MPC' && (
                    <CheckCircleIcon color="primary" sx={{ ml: 2 }} />
                  )}
                </CardContent>
              </ProtocolCard>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              지갑 비밀번호 설정
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              강력한 비밀번호를 설정하여 지갑 보안을 강화하세요.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="비밀번호"
                type="password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                placeholder="최소 8자 이상 입력하세요"
                fullWidth
                required
                error={walletPassword !== '' && Object.values(passwordErrors).some(Boolean)}
              />
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                비밀번호 요구사항:
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.length ? 'error.main' : 'success.main'}
              >
                • 최소 8자 이상
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.uppercase ? 'error.main' : 'success.main'}
              >
                • 최소 1개의 대문자 포함
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.number ? 'error.main' : 'success.main'}
              >
                • 최소 1개의 숫자 포함
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.special ? 'error.main' : 'success.main'}
              >
                • 최소 1개의 특수문자 포함
              </Typography>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="비밀번호 확인"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                error={confirmPassword !== '' && walletPassword !== confirmPassword}
                helperText={confirmPassword !== '' && walletPassword !== confirmPassword ? '비밀번호가 일치하지 않습니다.' : ''}
              />
            </FormControl>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              지갑 정보 확인
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              아래 정보를 확인하고 지갑을 생성하세요.
            </Typography>
            
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2">지갑 이름:</Typography>
              <Typography variant="body1" paragraph>{walletName}</Typography>
              
              <Typography variant="subtitle2">지갑 유형:</Typography>
              <Typography variant="body1" paragraph>{walletType}</Typography>
              
              <Typography variant="subtitle2">자산 유형:</Typography>
              <Typography variant="body1" paragraph>{assetType}</Typography>
              
              <Typography variant="subtitle2">서명 프로토콜:</Typography>
              <Typography variant="body1">{selectedProtocol}</Typography>
            </Box>
            
            <Alert severity="warning">
              중요: 지갑을 생성한 후에는 서명 프로토콜을 변경할 수 없습니다. 계속하시겠습니까?
            </Alert>
          </Box>
        );
      default:
        return '알 수 없는 단계';
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
        <Typography variant="h4" gutterBottom>
          새 지갑 생성
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Card variant="outlined">
          <CardContent>
            {getStepContent(activeStep)}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
              >
                이전
              </Button>
              <Button
                variant="contained"
                endIcon={activeStep === steps.length - 1 ? <AccountBalanceWalletIcon /> : <ArrowForwardIcon />}
                onClick={handleNext}
                disabled={!isStepValid() || loading}
              >
                {activeStep === steps.length - 1 ? '지갑 생성' : '다음'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </AppTheme>
  );
}
