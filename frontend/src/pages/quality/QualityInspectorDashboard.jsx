import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const QualityInspectorDashboard = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [qualityChecks, setQualityChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // 筛选条件
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 获取质检任务列表
  const fetchQualityChecks = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/quality-checks`, {
        params: { status },
        headers: { Authorization: `Bearer ${token}` }
      });
      setQualityChecks(response.data);
    } catch (err) {
      console.error('获取质检任务失败:', err);
      setError(err.response?.data?.message || '获取质检任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/quality-checks/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (currentTab === 0) {
      fetchQualityChecks('Pending,In Progress');
    } else {
      fetchQualityChecks('Completed');
    }
  }, [currentTab]);

  // 开始检验
  const handleStartInspection = async (checkId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/quality-checks/${checkId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 跳转到检验执行页面
      navigate(`/quality/inspect/${checkId}`);
    } catch (err) {
      console.error('开始检验失败:', err);
      setError(err.response?.data?.message || '开始检验失败');
    }
  };

  // 查看检验详情
  const handleViewDetails = (checkId) => {
    navigate(`/quality/inspect/${checkId}`);
  };

  // 获取检验类型标签颜色
  const getCheckTypeColor = (type) => {
    const colors = {
      'IQC': 'primary',
      'IPQC': 'info',
      'FQC': 'success',
      'OQC': 'warning'
    };
    return colors[type] || 'default';
  };

  // 获取状态标签颜色
  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Completed': 'default'
    };
    return colors[status] || 'default';
  };

  // 获取结果标签颜色和图标
  const getResultDisplay = (result) => {
    if (result === 'Pass') {
      return { color: 'success', icon: <CheckCircleIcon />, text: '合格' };
    } else if (result === 'Fail') {
      return { color: 'error', icon: <CancelIcon />, text: '不合格' };
    }
    return { color: 'default', icon: null, text: '-' };
  };

  // 筛选质检任务
  const filteredChecks = qualityChecks.filter(check => {
    let matches = true;
    
    if (filterType && check.checkType !== filterType) {
      matches = false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      matches = matches && (
        check.checkNumber?.toLowerCase().includes(searchLower) ||
        check.sourceDocument?.number?.toLowerCase().includes(searchLower) ||
        check.itemsToCheck?.some(item => item.model?.toLowerCase().includes(searchLower))
      );
    }
    
    return matches;
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          质检员工作台
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchQualityChecks(currentTab === 0 ? 'Pending,In Progress' : 'Completed');
            fetchStats();
          }}
        >
          刷新
        </Button>
      </Box>

      {/* 统计卡片 */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat._id}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {stat._id} 检验
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stat.total}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`待检: ${stat.pending}`} size="small" color="warning" />
                    <Chip label={`进行中: ${stat.inProgress}`} size="small" color="info" />
                  </Box>
                  {(stat.passed + stat.failed) > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      合格率: <strong>{stat.passRate}%</strong>
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 主要内容区 */}
      <Paper sx={{ width: '100%' }}>
        {/* 标签页 */}
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="待处理任务" />
          <Tab label="已完成任务" />
        </Tabs>

        {/* 筛选区域 */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="检验类型"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="IQC">IQC - 来料检验</MenuItem>
            <MenuItem value="IPQC">IPQC - 过程检验</MenuItem>
            <MenuItem value="FQC">FQC - 成品检验</MenuItem>
            <MenuItem value="OQC">OQC - 出货检验</MenuItem>
          </TextField>

          <TextField
            label="搜索"
            placeholder="检验单号/来源单号/产品型号"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
        </Box>

        {/* 任务列表 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredChecks.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {currentTab === 0 ? '暂无待处理任务' : '暂无已完成任务'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>检验单号</TableCell>
                  <TableCell>检验类型</TableCell>
                  <TableCell>来源单号</TableCell>
                  <TableCell>待检物料/产品</TableCell>
                  <TableCell align="center">数量</TableCell>
                  {currentTab === 0 ? (
                    <TableCell>状态</TableCell>
                  ) : (
                    <>
                      <TableCell>检验结果</TableCell>
                      <TableCell>缺陷数</TableCell>
                      <TableCell>完成时间</TableCell>
                    </>
                  )}
                  <TableCell>创建时间</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredChecks.map((check) => (
                  <TableRow key={check._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {check.checkNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={check.checkType}
                        color={getCheckTypeColor(check.checkType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{check.sourceDocument?.number || '-'}</TableCell>
                    <TableCell>
                      {check.itemsToCheck?.map((item, idx) => (
                        <Typography key={idx} variant="body2">
                          {item.model}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell align="center">
                      {check.itemsToCheck?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                    </TableCell>
                    {currentTab === 0 ? (
                      <TableCell>
                        <Chip
                          label={check.status === 'Pending' ? '待检验' : '检验中'}
                          color={getStatusColor(check.status)}
                          size="small"
                        />
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          {check.overallResult && (
                            <Chip
                              icon={getResultDisplay(check.overallResult).icon}
                              label={getResultDisplay(check.overallResult).text}
                              color={getResultDisplay(check.overallResult).color}
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {check.defectCount > 0 ? (
                            <Chip label={check.defectCount} color="error" size="small" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {check.completedAt ? new Date(check.completedAt).toLocaleString('zh-CN') : '-'}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {new Date(check.createdAt).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell align="center">
                      {currentTab === 0 ? (
                        check.status === 'Pending' ? (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartInspection(check._id)}
                          >
                            开始检验
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewDetails(check._id)}
                          >
                            继续检验
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(check._id)}
                        >
                          查看详情
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default QualityInspectorDashboard;

