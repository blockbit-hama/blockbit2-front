"use client";

import * as React from 'react';
import { useState } from 'react';
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

// 아이콘
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import { brand, gray } from '@/theme/themePrimitives';

// 자산 인터페이스
interface Asset {
  id: number;
  name: string;
  symbol: string;
  balance: string;
  balanceUsd: string;
  price: string;
  portfolioPercent: string;
}

// 정렬 필드 타입
type SortField = 'name' | 'balance' | 'price' | 'portfolioPercent';

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
    case 'USD':
      bgColor = '#71B2C920';
      color = '#71B2C9';
      break;
  }
  
  return (
    <AssetAvatar style={{ backgroundColor: bgColor, color: color }}>
      {symbol.charAt(0)}
    </AssetAvatar>
  );
};

// 임시 자산 데이터
const userAssets: Asset[] = [
  { 
    id: 1, 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    balance: '0 BTC', 
    balanceUsd: '$0.00 USD', 
    price: '$95,563.72 USD', 
    portfolioPercent: '0%'
  },
  { 
    id: 2, 
    name: 'Ethereum', 
    symbol: 'ETH', 
    balance: '0 ETH', 
    balanceUsd: '$0.00 USD', 
    price: '$1,827.29 USD', 
    portfolioPercent: '0%'
  },
  { 
    id: 3, 
    name: 'Tether', 
    symbol: 'USDT', 
    balance: '0 USDT', 
    balanceUsd: '$0.00 USD', 
    price: '$1.00 USD', 
    portfolioPercent: '0%'
  },
  { 
    id: 4, 
    name: 'BNB Token', 
    symbol: 'BNB', 
    balance: '0 BNB', 
    balanceUsd: '$0.00 USD', 
    price: '$594.90 USD', 
    portfolioPercent: '0%'
  },
  { 
    id: 5, 
    name: 'Solana', 
    symbol: 'SOL', 
    balance: '0 SOL', 
    balanceUsd: '$0.00 USD', 
    price: '$145.42 USD', 
    portfolioPercent: '0%'
  },
  { 
    id: 6, 
    name: 'US Dollar', 
    symbol: 'USD', 
    balance: '0 FIATUSD', 
    balanceUsd: '$0.00 USD', 
    price: '$1.00 USD', 
    portfolioPercent: '0%'
  }
];

export default function Wallet(props: { disableCustomTheme?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const open = Boolean(anchorEl);
  
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
  
  // 검색 및 정렬이 적용된 자산 목록
  const filteredAssets = sortAssets(
    searchAssets(userAssets, searchTerm),
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
        {/* 총 자산 가치 영역 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            $0.00 USD
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
              {filteredAssets.map((asset) => (
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
                      <ActionButton variant="outlined" startIcon={<ArrowDropDownIcon />}>
                        Deposit
                      </ActionButton>
                      <ActionButton variant="outlined" startIcon={<ArrowDropDownIcon />}>
                        Withdraw
                      </ActionButton>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </AppTheme>
  );
}
