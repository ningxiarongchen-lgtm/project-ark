import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Divider,
  Checkbox,
  Toolbar,
  Snackbar
} from '@mui/material';
import {
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Upload as UploadIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assignment as AssignmentIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ContractCenter = () => {
  const [tabValue, setTabValue] = useState(0);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sealDialogOpen, setSealDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [sealFile, setSealFile] = useState(null);
  const [sealComments, setSealComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // 批量操作相关状态
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 加载合同列表
  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 根据Tab值筛选
      const params = {};
      if (tabValue === 1) {
        params.contract_type = '销售合同';
      } else if (tabValue === 2) {
        params.contract_type = '采购合同';
      } else if (tabValue === 3) {
        params.status = '待盖章';
      } else if (tabValue === 4) {
        params.status = '已盖章';
      }

      const response = await api.get('/contracts', { params });
      setContracts(response.data.data);
      setSelectedIds([]); // 清空选择
      setSelectAll(false);
    } catch (err) {
      console.error('加载合同列表失败:', err);
      setError(err.response?.data?.message || '加载合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await api.get('/contracts/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('加载统计信息失败:', err);
    }
  };

  useEffect(() => {
    loadContracts();
    loadStats();
  }, [tabValue]);

  // 处理全选
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = contracts.map(c => c._id);
      setSelectedIds(allIds);
      setSelectAll(true);
    } else {
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  // 处理单个选择
  const handleSelectOne = (id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1)
      );
    }

    setSelectedIds(newSelected);
    setSelectAll(newSelected.length === contracts.length);
  };

  // 批量接单
  const handleBatchAccept = async () => {
    if (selectedIds.length === 0) {
      setError('请选择要接单的合同');
      return;
    }

    try {
      setBatchProcessing(true);
      let successCount = 0;
      let failCount = 0;

      for (const contractId of selectedIds) {
        const contract = contracts.find(c => c._id === contractId);
        if (contract && contract.status === '待盖章') {
          try {
            await api.put(`/contracts/${contractId}/accept`);
            successCount++;
          } catch (err) {
            console.error(`接单失败 ${contractId}:`, err);
            failCount++;
          }
        }
      }

      setSuccessMessage(`批量接单完成：成功 ${successCount} 个，失败 ${failCount} 个`);
      loadContracts();
      loadStats();
    } catch (err) {
      setError('批量接单失败');
    } finally {
      setBatchProcessing(false);
    }
  };

  // 批量导出Excel
  const handleBatchExportExcel = () => {
    if (selectedIds.length === 0) {
      setError('请选择要导出的合同');
      return;
    }

    const selectedContracts = contracts.filter(c => selectedIds.includes(c._id));
    const exportData = selectedContracts.map(c => ({
      '合同编号': c.contract_number,
      '合同名称': c.contract_name,
      '合同类型': c.contract_type,
      '合同金额': c.contract_amount,
      '币种': c.currency,
      '状态': c.status,
      '对方名称': c.counterparty.name,
      '对方公司': c.counterparty.company || '-',
      '创建时间': format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN }),
      '提交时间': c.submitted_at ? format(new Date(c.submitted_at), 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '-',
      '盖章时间': c.sealed_at ? format(new Date(c.sealed_at), 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '合同数据');
    XLSX.writeFile(wb, `合同数据_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    
    setSuccessMessage(`成功导出 ${selectedIds.length} 个合同`);
  };

  // 批量导出PDF
  const handleBatchExportPDF = () => {
    if (selectedIds.length === 0) {
      setError('请选择要导出的合同');
      return;
    }

    const selectedContracts = contracts.filter(c => selectedIds.includes(c._id));
    const doc = new jsPDF();

    // 添加中文字体支持（简化版）
    doc.setFont('helvetica');
    
    selectedContracts.forEach((contract, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc.setFontSize(16);
      doc.text('Contract Details', 20, 20);
      
      doc.setFontSize(12);
      let y = 40;
      
      doc.text(`Contract Number: ${contract.contract_number}`, 20, y);
      y += 10;
      doc.text(`Contract Name: ${contract.contract_name}`, 20, y);
      y += 10;
      doc.text(`Contract Type: ${contract.contract_type}`, 20, y);
      y += 10;
      doc.text(`Amount: ${contract.contract_amount} ${contract.currency}`, 20, y);
      y += 10;
      doc.text(`Status: ${contract.status}`, 20, y);
      y += 10;
      doc.text(`Counterparty: ${contract.counterparty.name}`, 20, y);
      y += 10;
      doc.text(`Created: ${format(new Date(contract.createdAt), 'yyyy-MM-dd HH:mm')}`, 20, y);
    });

    doc.save(`Contracts_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
    setSuccessMessage(`成功导出 ${selectedIds.length} 个合同到PDF`);
  };

  // 批量删除（仅草稿状态）
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      setError('请选择要删除的合同');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 个合同吗？只能删除待盖章状态的合同。`)) {
      return;
    }

    try {
      setBatchProcessing(true);
      let successCount = 0;
      let failCount = 0;

      for (const contractId of selectedIds) {
        const contract = contracts.find(c => c._id === contractId);
        if (contract && contract.status === '待盖章') {
          try {
            await api.delete(`/contracts/${contractId}`);
            successCount++;
          } catch (err) {
            console.error(`删除失败 ${contractId}:`, err);
            failCount++;
          }
        } else {
          failCount++;
        }
      }

      setSuccessMessage(`批量删除完成：成功 ${successCount} 个，失败 ${failCount} 个`);
      loadContracts();
      loadStats();
    } catch (err) {
      setError('批量删除失败');
    } finally {
      setBatchProcessing(false);
    }
  };

  // 查看合同详情
  const handleViewDetail = async (contract) => {
    try {
      const response = await api.get(`/contracts/${contract._id}`);
      setSelectedContract(response.data.data);
      setDetailDialogOpen(true);
    } catch (err) {
      console.error('获取合同详情失败:', err);
      setError(err.response?.data?.message || '获取合同详情失败');
    }
  };

  // 接单
  const handleAccept = async (contractId) => {
    try {
      setProcessing(true);
      await api.put(`/contracts/${contractId}/accept`);
      setError(null);
      setSuccessMessage('接单成功');
      loadContracts();
      loadStats();
      setDetailDialogOpen(false);
    } catch (err) {
      console.error('接单失败:', err);
      setError(err.response?.data?.message || '接单失败');
    } finally {
      setProcessing(false);
    }
  };

  // 打开盖章对话框
  const handleOpenSealDialog = (contract) => {
    setSelectedContract(contract);
    setSealDialogOpen(true);
    setSealFile(null);
    setSealComments('');
  };

  // 上传盖章文件
  const handleSealFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSealFile({
        file_name: file.name,
        file_size: file.size,
        file_url: URL.createObjectURL(file),
      });
    }
  };

  // 完成盖章
  const handleCompleteSeal = async () => {
    if (!sealFile) {
      setError('请上传盖章版合同文件');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/contracts/${selectedContract._id}/seal`, {
        sealed_file: sealFile,
        comments: sealComments
      });
      setError(null);
      setSuccessMessage('合同盖章完成');
      setSealDialogOpen(false);
      loadContracts();
      loadStats();
      setDetailDialogOpen(false);
    } catch (err) {
      console.error('盖章失败:', err);
      setError(err.response?.data?.message || '盖章失败');
    } finally {
      setProcessing(false);
    }
  };

  // 驳回合同
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('请输入驳回原因');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/contracts/${selectedContract._id}/reject`, {
        rejection_reason: rejectReason
      });
      setError(null);
      setSuccessMessage('合同已驳回');
      setRejectDialogOpen(false);
      loadContracts();
      loadStats();
      setDetailDialogOpen(false);
    } catch (err) {
      console.error('驳回失败:', err);
      setError(err.response?.data?.message || '驳回失败');
    } finally {
      setProcessing(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colors = {
      '待盖章': 'warning',
      '已盖章': 'success',
      '已驳回': 'error',
      '已作废': 'default'
    };
    return colors[status] || 'default';
  };

  // 获取合同类型颜色
  const getContractTypeColor = (type) => {
    return type === '销售合同' ? 'primary' : 'secondary';
  };

  // 格式化金额
  const formatAmount = (amount, currency = 'CNY') => {
    const currencySymbols = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      JPY: '¥'
    };
    return `${currencySymbols[currency] || ''}${amount?.toLocaleString() || 0}`;
  };

  const isSelected = (id) => selectedIds.indexOf(id) !== -1;

  return (
    <Box>
      {/* 页面标题 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <AssignmentIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          合同管理中心
        </Typography>
        <Typography variant="body2" color="text.secondary">
          统一管理所有销售合同和采购合同
        </Typography>
      </Box>

      {/* 统计卡片 */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  待盖章合同
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  销售: {stats.by_type_and_status.sales.pending} / 
                  采购: {stats.by_type_and_status.purchase.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  已盖章合同
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.sealed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  销售: {stats.by_type_and_status.sales.sealed} / 
                  采购: {stats.by_type_and_status.purchase.sealed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  未分配待办
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.unassigned_pending}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  需要接单处理
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  本月新增
                </Typography>
                <Typography variant="h4">
                  {stats.this_month}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  销售: {stats.sales_contracts} / 采购: {stats.purchase_contracts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 成功提示 */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />

      {/* Tab切换 */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={stats?.pending} color="warning">
                全部合同
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.sales_contracts} color="primary">
                销售合同
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.purchase_contracts} color="secondary">
                采购合同
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.pending} color="warning">
                待盖章
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.sealed} color="success">
                已盖章
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* 批量操作工具栏 */}
      {selectedIds.length > 0 && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Toolbar disableGutters>
            <Typography variant="subtitle1" sx={{ flex: 1 }}>
              已选择 {selectedIds.length} 个合同
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignmentTurnedInIcon />}
              onClick={handleBatchAccept}
              disabled={batchProcessing}
              sx={{ mr: 1 }}
            >
              批量接单
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleBatchExportExcel}
              disabled={batchProcessing}
              sx={{ mr: 1 }}
            >
              导出Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handleBatchExportPDF}
              disabled={batchProcessing}
              sx={{ mr: 1 }}
            >
              导出PDF
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBatchDelete}
              disabled={batchProcessing}
            >
              批量删除
            </Button>
          </Toolbar>
        </Paper>
      )}

      {/* 合同列表 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < contracts.length}
                    checked={selectAll && contracts.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>合同编号</TableCell>
                <TableCell>合同名称</TableCell>
                <TableCell>合同类型</TableCell>
                <TableCell>关联项目/订单</TableCell>
                <TableCell>对方</TableCell>
                <TableCell align="right">金额</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>发起人</TableCell>
                <TableCell>提交时间</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography color="text.secondary">暂无合同</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => {
                  const isItemSelected = isSelected(contract._id);
                  
                  return (
                    <TableRow 
                      key={contract._id} 
                      hover
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={() => handleSelectOne(contract._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {contract.contract_number}
                        </Typography>
                      </TableCell>
                      <TableCell>{contract.contract_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={contract.contract_type}
                          color={getContractTypeColor(contract.contract_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {contract.contract_type === '销售合同' ? (
                          <Box>
                            <Typography variant="body2">
                              {contract.project_snapshot?.project_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {contract.project_snapshot?.project_name}
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2">
                              {contract.purchase_order_snapshot?.order_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {contract.purchase_order_snapshot?.supplier_name}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {contract.counterparty.name}
                          </Typography>
                          {contract.counterparty.company && (
                            <Typography variant="caption" color="text.secondary">
                              {contract.counterparty.company}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatAmount(contract.contract_amount, contract.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {contract.created_by?.full_name}
                      </TableCell>
                      <TableCell>
                        {contract.submitted_at && format(
                          new Date(contract.submitted_at),
                          'yyyy-MM-dd HH:mm',
                          { locale: zhCN }
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="查看详情">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetail(contract)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {contract.status === '待盖章' && (
                            <>
                              {!contract.business_engineer && (
                                <Tooltip title="接单处理">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleAccept(contract._id)}
                                  >
                                    <AssignmentTurnedInIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="上传盖章版">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenSealDialog(contract)}
                                >
                                  <UploadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="驳回">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedContract(contract);
                                    setRejectDialogOpen(true);
                                    setRejectReason('');
                                  }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 合同详情对话框 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          合同详情 - {selectedContract?.contract_number}
        </DialogTitle>
        <DialogContent dividers>
          {selectedContract && (
            <Box>
              {/* 基本信息 */}
              <Typography variant="h6" gutterBottom>基本信息</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">合同名称</Typography>
                  <Typography variant="body1">{selectedContract.contract_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">合同类型</Typography>
                  <Chip
                    label={selectedContract.contract_type}
                    color={getContractTypeColor(selectedContract.contract_type)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">合同金额</Typography>
                  <Typography variant="h6" color="primary">
                    {formatAmount(selectedContract.contract_amount, selectedContract.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">状态</Typography>
                  <Chip
                    label={selectedContract.status}
                    color={getStatusColor(selectedContract.status)}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 对方信息 */}
              <Typography variant="h6" gutterBottom>对方信息</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">名称</Typography>
                  <Typography variant="body1">{selectedContract.counterparty.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">公司</Typography>
                  <Typography variant="body1">{selectedContract.counterparty.company || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">联系人</Typography>
                  <Typography variant="body1">{selectedContract.counterparty.contact_person || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">联系电话</Typography>
                  <Typography variant="body1">{selectedContract.counterparty.contact_phone || '-'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* 合同文件 */}
              <Typography variant="h6" gutterBottom>合同文件</Typography>
              <Box sx={{ mb: 3 }}>
                {selectedContract.draft_file && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1 }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      草稿文件: {selectedContract.draft_file.file_name}
                    </Typography>
                    <IconButton size="small" color="primary">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {selectedContract.sealed_file && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      盖章版文件: {selectedContract.sealed_file.file_name}
                    </Typography>
                    <IconButton size="small" color="primary">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* 跟进记录 */}
              {selectedContract.follow_ups && selectedContract.follow_ups.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>跟进记录</Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {selectedContract.follow_ups.map((followUp, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(followUp.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })} - 
                          {followUp.user_name} ({followUp.user_role})
                        </Typography>
                        <Typography variant="body2">{followUp.content}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedContract?.status === '待盖章' && (
            <>
              {!selectedContract.business_engineer && (
                <Button
                  onClick={() => handleAccept(selectedContract._id)}
                  color="primary"
                  disabled={processing}
                >
                  接单处理
                </Button>
              )}
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenSealDialog(selectedContract);
                }}
                color="success"
                startIcon={<UploadIcon />}
                disabled={processing}
              >
                上传盖章版
              </Button>
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  setRejectDialogOpen(true);
                  setRejectReason('');
                }}
                color="error"
                disabled={processing}
              >
                驳回
              </Button>
            </>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 盖章对话框 */}
      <Dialog open={sealDialogOpen} onClose={() => setSealDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>上传盖章版合同</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<AttachFileIcon />}
              sx={{ mb: 2 }}
            >
              选择盖章版文件
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleSealFileChange}
              />
            </Button>
            {sealFile && (
              <Alert severity="success" sx={{ mb: 2 }}>
                已选择文件: {sealFile.file_name}
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="审批意见（可选）"
              value={sealComments}
              onChange={(e) => setSealComments(e.target.value)}
              placeholder="填写审批意见..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSealDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCompleteSeal}
            variant="contained"
            color="success"
            disabled={!sealFile || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {processing ? '处理中...' : '完成盖章'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 驳回对话框 */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>驳回合同</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="驳回原因"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请说明驳回原因..."
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim() || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {processing ? '处理中...' : '确认驳回'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractCenter;
