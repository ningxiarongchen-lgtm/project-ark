import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { contractsAPI } from '../services/api';
import * as XLSX from 'xlsx';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ContractAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [dateRange, setDateRange] = useState('3months'); // 3months, 6months, 1year, all
  const [error, setError] = useState(null);

  // 统计数据
  const [statistics, setStatistics] = useState({
    totalContracts: 0,
    totalAmount: 0,
    salesContracts: 0,
    purchaseContracts: 0,
    averageAmount: 0,
    averageProcessTime: 0
  });

  // 图表数据
  const [trendData, setTrendData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  // 加载合同数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 计算日期范围
      const endDate = new Date();
      let startDate;
      
      switch (dateRange) {
        case '3months':
          startDate = subMonths(endDate, 3);
          break;
        case '6months':
          startDate = subMonths(endDate, 6);
          break;
        case '1year':
          startDate = subMonths(endDate, 12);
          break;
        default:
          startDate = new Date(2020, 0, 1); // 全部
      }

      const response = await contractsAPI.getAll({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: 1000
      });

      const contractsData = response.data.data || [];
      setContracts(contractsData);

      // 计算统计数据
      calculateStatistics(contractsData);
      
      // 生成图表数据
      generateChartData(contractsData, startDate, endDate);

    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err.response?.data?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  // 计算统计数据
  const calculateStatistics = (contractsData) => {
    const totalContracts = contractsData.length;
    const totalAmount = contractsData.reduce((sum, c) => sum + (c.contract_amount || 0), 0);
    const salesContracts = contractsData.filter(c => c.contract_type === '销售合同').length;
    const purchaseContracts = contractsData.filter(c => c.contract_type === '采购合同').length;
    const averageAmount = totalContracts > 0 ? totalAmount / totalContracts : 0;

    // 计算平均处理时间（从提交到盖章完成）
    const sealedContracts = contractsData.filter(c => c.status === '已盖章' && c.sealed_at && c.submitted_at);
    const totalProcessTime = sealedContracts.reduce((sum, c) => {
      const submitted = new Date(c.submitted_at);
      const sealed = new Date(c.sealed_at);
      const days = (sealed - submitted) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    const averageProcessTime = sealedContracts.length > 0 ? totalProcessTime / sealedContracts.length : 0;

    setStatistics({
      totalContracts,
      totalAmount,
      salesContracts,
      purchaseContracts,
      averageAmount,
      averageProcessTime
    });
  };

  // 生成图表数据
  const generateChartData = (contractsData, startDate, endDate) => {
    // 按类型统计
    const typeStats = {
      '销售合同': contractsData.filter(c => c.contract_type === '销售合同').length,
      '采购合同': contractsData.filter(c => c.contract_type === '采购合同').length
    };
    setTypeData([
      { name: '销售合同', value: typeStats['销售合同'] },
      { name: '采购合同', value: typeStats['采购合同'] }
    ]);

    // 按状态统计
    const statusStats = {};
    contractsData.forEach(c => {
      statusStats[c.status] = (statusStats[c.status] || 0) + 1;
    });
    setStatusData(Object.entries(statusStats).map(([name, value]) => ({ name, value })));

    // 按月统计
    const monthlyStats = {};
    contractsData.forEach(c => {
      const month = format(new Date(c.createdAt), 'yyyy-MM');
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month,
          销售合同: 0,
          采购合同: 0,
          totalAmount: 0
        };
      }
      if (c.contract_type === '销售合同') {
        monthlyStats[month].销售合同++;
      } else {
        monthlyStats[month].采购合同++;
      }
      monthlyStats[month].totalAmount += c.contract_amount || 0;
    });

    const monthlyArray = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
    setMonthlyData(monthlyArray);

    // 金额趋势
    setTrendData(monthlyArray.map(m => ({
      month: m.month,
      amount: m.totalAmount / 10000 // 转换为万元
    })));
  };

  // 导出Excel报表
  const handleExport = () => {
    const exportData = contracts.map(c => ({
      '合同编号': c.contract_number,
      '合同名称': c.contract_name,
      '合同类型': c.contract_type,
      '合同金额': c.contract_amount,
      '币种': c.currency,
      '状态': c.status,
      '对方': c.counterparty.name,
      '创建时间': format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm'),
      '提交时间': c.submitted_at ? format(new Date(c.submitted_at), 'yyyy-MM-dd HH:mm') : '-',
      '盖章时间': c.sealed_at ? format(new Date(c.sealed_at), 'yyyy-MM-dd HH:mm') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '合同数据');
    XLSX.writeFile(wb, `合同数据分析_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 页面标题 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <AssessmentIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
            合同数据分析
          </Typography>
          <Typography variant="body2" color="text.secondary">
            数据驱动决策，洞察合同管理
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>时间范围</InputLabel>
            <Select
              value={dateRange}
              label="时间范围"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="3months">近3个月</MenuItem>
              <MenuItem value="6months">近6个月</MenuItem>
              <MenuItem value="1year">近1年</MenuItem>
              <MenuItem value="all">全部</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            导出Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 统计卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>合同总数</Typography>
              <Typography variant="h4">{statistics.totalContracts}</Typography>
              <Typography variant="caption" color="text.secondary">
                销售: {statistics.salesContracts} / 采购: {statistics.purchaseContracts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>合同总金额</Typography>
              <Typography variant="h4" color="primary">
                ¥{(statistics.totalAmount / 10000).toFixed(2)}万
              </Typography>
              <Typography variant="caption" color="text.secondary">
                平均: ¥{(statistics.averageAmount / 10000).toFixed(2)}万
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>平均处理时间</Typography>
              <Typography variant="h4" color="success.main">
                {statistics.averageProcessTime.toFixed(1)}天
              </Typography>
              <Typography variant="caption" color="text.secondary">
                从提交到盖章完成
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>盖章完成率</Typography>
              <Typography variant="h4" color="info.main">
                {statistics.totalContracts > 0 
                  ? ((contracts.filter(c => c.status === '已盖章').length / statistics.totalContracts) * 100).toFixed(1)
                  : 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                已盖章 / 总数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 图表区域 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* 金额趋势图 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>合同金额趋势（万元）</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="金额" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 合同类型分布 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>合同类型分布</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 月度合同数量 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>月度合同数量</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="销售合同" fill="#0088FE" />
                  <Bar dataKey="采购合同" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 合同状态分布 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>合同状态分布</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 详细数据表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>合同列表详情</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>合同编号</TableCell>
                  <TableCell>合同名称</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell align="right">金额</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.slice(0, 10).map((contract) => (
                  <TableRow key={contract._id} hover>
                    <TableCell>{contract.contract_number}</TableCell>
                    <TableCell>{contract.contract_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.contract_type} 
                        size="small"
                        color={contract.contract_type === '销售合同' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ¥{contract.contract_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status} 
                        size="small"
                        color={contract.status === '已盖章' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(contract.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {contracts.length > 10 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              显示前10条，共{contracts.length}条数据。请导出Excel查看完整数据。
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ContractAnalytics;

