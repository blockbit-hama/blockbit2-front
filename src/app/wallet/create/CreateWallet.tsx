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
import { getUserId } from '@/lib/auth';
import { createWallet } from '@/services/walletService';
import { getAssetIdByType } from '@/services/assetService';
import { createAddress } from '@/services/addressService';

// Signature protocol card component styling
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

// Wallet creation steps
const steps = ['Wallet Info', 'Signature Protocol', 'Password Setup', 'Confirmation'];

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
      // 마지막 단계에서는 지갑 생성 API 호출
      handleCreateWallet();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // 주소 생성을 위한 함수
  const generateAddressForWallet = (asset: string) => {
    let prefix = '';
    let derivationPath = '';
    
    // 자산 유형에 따른 주소 형식 및 prefix 설정
    switch (asset) {
      case 'Bitcoin':
        prefix = 'bc1q';
        derivationPath = 'm/84\'/0\'/0\'/0/0';
        break;
      case 'Ethereum':
      case 'ERC-20':
        prefix = '0x';
        derivationPath = 'm/44\'/60\'/0\'/0/0';
        break;
      case 'Bitcoin Cash':
        prefix = 'bitcoincash:q';
        derivationPath = 'm/44\'/145\'/0\'/0/0';
        break;
      case 'Litecoin':
        prefix = 'ltc1q';
        derivationPath = 'm/84\'/2\'/0\'/0/0';
        break;
      case 'Ripple':
        prefix = 'r';
        derivationPath = 'm/44\'/144\'/0\'/0/0';
        break;
      default:
        prefix = '0x';
        derivationPath = 'm/44\'/0\'/0\'/0/0';
    }
    
    // 랜덤 문자열 생성 (시뮬레이션)
    const randomChars = Array.from({ length: 30 }, () => {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    
    let address = prefix + randomChars;
    
    // 자산 유형별 최대 길이 조정
    if (asset === 'Bitcoin' || asset === 'Litecoin') {
      address = address.substring(0, 42); // 비트코인/라이트코인 주소 길이 제한
    } else if (asset === 'Ethereum' || asset === 'ERC-20') {
      address = address.substring(0, 42); // 이더리움 주소는 42자 (0x 포함)
    } else if (asset === 'Ripple') {
      address = address.substring(0, 34); // 리플 주소 길이 제한
    }
    
    return { address, path: derivationPath };
  };

  // 지갑 생성 API 호출
  const handleCreateWallet = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userId = getUserId();
      
      if (!userId) {
        throw new Error('User information not found. Please log in again.');
      }
      
      // 자산 ID 가져오기
      const assetId = getAssetIdByType(assetType);
      
      // 지갑 생성 API 호출
      const walletResponse = await createWallet({
        walName: walletName,
        walType: walletType,
        walProtocol: selectedProtocol,
        walPwd: walletPassword,
        walStatus: 'active',
        usiNum: userId,
        astId: assetId,
        polId: 1 // 정책 ID는 일단 1로 고정
      });
      
      // 지갑 생성 성공하면 주소 생성
      if (walletResponse && walletResponse.walNum) {
        // 주소 자동 생성
        const { address } = generateAddressForWallet(assetType);
        const addressLabel = `${assetType} ${walletType} Wallet Main Address`;
        
        // 주소 생성 API 호출
        await createAddress({
          adrAddress: address,
          adrLabel: addressLabel,
          adrType: 'receive', // 기본 receive 타입으로 설정
          adrPath: generateAddressForWallet(assetType).path,
          walId: walletResponse.walNum,
          astId: assetId
        });
      }
      
      // 지갑 생성 성공 시 지갑 목록 페이지로 이동
      router.push('/wallet');
    } catch (error) {
      console.error('Wallet creation error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 각 단계별 컴포넌트 렌더링
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Wallet Name"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Example: Bitcoin Main Wallet"
                fullWidth
                required
              />
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="wallet-type-label">Wallet Type</InputLabel>
              <Select
                labelId="wallet-type-label"
                value={walletType}
                onChange={(e) => setWalletType(e.target.value)}
                label="Wallet Type"
                fullWidth
              >
                <MenuItem value="Self-custody Hot">Self-custody Hot</MenuItem>
                <MenuItem value="Cold">Cold</MenuItem>
                <MenuItem value="Trading">Trading</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="asset-type-label">Asset Type</InputLabel>
              <Select
                labelId="asset-type-label"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                label="Asset Type"
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
              Signature Protocol
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose a signature protocol for your wallet. Once the wallet is created, the signature protocol cannot be changed.
              <Link href="#" color="primary" sx={{ ml: 1 }}>
                Learn more
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
                      Uses on-chain cryptography with 3 keys (user, backup, BitGo). Each key has a unique public key, and transactions require signatures from 2 out of 3 keys. Signatures are performed asynchronously between co-signers.
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
                      A cryptographic technique where multiple parties jointly perform calculations without revealing their secret inputs to each other. Ideal for Ethereum-based assets, offering higher security and efficiency.
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
              Wallet Password Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Set a strong password to enhance wallet security.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Password"
                type="password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                placeholder="Enter at least 8 characters"
                fullWidth
                required
                error={walletPassword !== '' && Object.values(passwordErrors).some(Boolean)}
              />
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Password requirements:
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.length ? 'error.main' : 'success.main'}
              >
                • Minimum 8 characters
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.uppercase ? 'error.main' : 'success.main'}
              >
                • At least 1 uppercase letter
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.number ? 'error.main' : 'success.main'}
              >
                • At least 1 number
              </Typography>
              <Typography 
                variant="body2" 
                color={passwordErrors.special ? 'error.main' : 'success.main'}
              >
                • At least 1 special character
              </Typography>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                error={confirmPassword !== '' && walletPassword !== confirmPassword}
                helperText={confirmPassword !== '' && walletPassword !== confirmPassword ? 'Passwords do not match.' : ''}
              />
            </FormControl>
          </Box>
        );
      case 3:
        // 주소 미리보기 정보 생성
        const { address } = generateAddressForWallet(assetType);
        const addressLabel = `${assetType} ${walletType} Wallet Main Address`;
        
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Wallet Information Confirmation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Verify the information below and create your wallet.
            </Typography>
            
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2">Wallet Name:</Typography>
              <Typography variant="body1" paragraph>{walletName}</Typography>
              
              <Typography variant="subtitle2">Wallet Type:</Typography>
              <Typography variant="body1" paragraph>{walletType}</Typography>
              
              <Typography variant="subtitle2">Asset Type:</Typography>
              <Typography variant="body1" paragraph>{assetType}</Typography>
              
              <Typography variant="subtitle2">Signature Protocol:</Typography>
              <Typography variant="body1" paragraph>{selectedProtocol}</Typography>
              
              <Typography variant="subtitle2">New Address (automatically generated):</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 1 }}>{address}</Typography>
              
              <Typography variant="subtitle2">Address Label:</Typography>
              <Typography variant="body1">{addressLabel}</Typography>
            </Box>
            
            <Alert severity="warning">
              Important: Once the wallet is created, the signature protocol cannot be changed. Do you want to continue?
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
          Create New Wallet
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
                Previous
              </Button>
              <Button
                variant="contained"
                endIcon={activeStep === steps.length - 1 ? <AccountBalanceWalletIcon /> : <ArrowForwardIcon />}
                onClick={handleNext}
                disabled={!isStepValid() || loading}
              >
                {activeStep === steps.length - 1 ? 'Create Wallet' : 'Next'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </AppTheme>
  );
}
