import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { contractsAPI } from '../services/api';
import { uploadFileToLeanCloud, validateFileType, validateFileSize, formatFileSize } from '../utils/fileUpload';

const CreateSalesContractDialog = ({ open, onClose, project, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const [formData, setFormData] = useState({
    contract_name: '',
    contract_amount: '',
    currency: 'CNY',
    signing_date: '',
    effective_date: '',
    expiry_date: '',
    counterparty: {
      name: '',
      company: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      address: ''
    },
    payment_terms: {
      method: '预付款+尾款',
      advance_payment_ratio: 30,
      advance_payment_amount: '',
      final_payment_amount: ''
    },
    delivery_info: {
      delivery_address: '',
      delivery_date: '',
      delivery_method: '物流',
      contact_person: '',
      contact_phone: ''
    },
    description: '',
    notes: '',
    priority: 'Normal'
  });

  // 当项目数据加载时，自动填充客户信息
  useEffect(() => {
    if (project && open) {
      setFormData(prev => ({
        ...prev,
        contract_name: `${project.projectName || project.projectNumber} 销售合同`,
        contract_amount: project.estimatedValue || project.budget || '',
        counterparty: {
          ...prev.counterparty,
          name: project.client?.name || '',
          company: project.client?.company || '',
          contact_phone: project.client?.phone || '',
          address: project.client?.address || ''
        }
      }));

      // 自动计算预付款金额
      if (project.estimatedValue || project.budget) {
        const totalAmount = project.estimatedValue || project.budget;
        const advanceAmount = Math.round(totalAmount * 0.3);
        const finalAmount = totalAmount - advanceAmount;
        
        setFormData(prev => ({
          ...prev,
          payment_terms: {
            ...prev.payment_terms,
            advance_payment_amount: advanceAmount,
            final_payment_amount: finalAmount
          }
        }));
      }
    }
  }, [project, open]);

  // 处理表单字段变化
  const handleChange = (field, value, nested = null) => {
    if (nested) {
      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 处理合同金额变化时自动计算预付款
  const handleAmountChange = (value) => {
    setFormData(prev => {
      const ratio = prev.payment_terms.advance_payment_ratio / 100;
      const advanceAmount = Math.round(value * ratio);
      const finalAmount = value - advanceAmount;
      
      return {
        ...prev,
        contract_amount: value,
        payment_terms: {
          ...prev.payment_terms,
          advance_payment_amount: advanceAmount,
          final_payment_amount: finalAmount
        }
      };
    });
  };

  // 处理预付款比例变化
  const handleAdvanceRatioChange = (ratio) => {
    const totalAmount = formData.contract_amount;
    if (totalAmount) {
      const advanceAmount = Math.round(totalAmount * (ratio / 100));
      const finalAmount = totalAmount - advanceAmount;
      
      setFormData(prev => ({
        ...prev,
        payment_terms: {
          ...prev.payment_terms,
          advance_payment_ratio: ratio,
          advance_payment_amount: advanceAmount,
          final_payment_amount: finalAmount
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        payment_terms: {
          ...prev.payment_terms,
          advance_payment_ratio: ratio
        }
      }));
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!validateFileType(file, ['.pdf', '.doc', '.docx'])) {
      setError('只支持 PDF、Word 文档格式');
      return;
    }

    // 验证文件大小（最大10MB）
    if (!validateFileSize(file, 10)) {
      setError('文件大小不能超过 10MB');
      return;
    }

    try {
      setUploadingFile(true);
      setError(null);

      const fileInfo = await uploadFileToLeanCloud(file, 'contracts');
      setUploadedFile(fileInfo);
    } catch (err) {
      console.error('文件上传失败:', err);
      setError(err.message || '文件上传失败');
    } finally {
      setUploadingFile(false);
    }
  };

  // 移除已上传的文件
  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  // 提交合同
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.contract_name.trim()) {
      setError('请填写合同名称');
      return;
    }

    if (!formData.contract_amount || formData.contract_amount <= 0) {
      setError('请填写合同金额');
      return;
    }

    if (!formData.counterparty.name.trim()) {
      setError('请填写客户名称');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contractData = {
        project_id: project._id,
        contract_name: formData.contract_name,
        contract_amount: parseFloat(formData.contract_amount),
        currency: formData.currency,
        signing_date: formData.signing_date || undefined,
        effective_date: formData.effective_date || undefined,
        expiry_date: formData.expiry_date || undefined,
        counterparty: formData.counterparty,
        payment_terms: {
          ...formData.payment_terms,
          advance_payment_amount: parseFloat(formData.payment_terms.advance_payment_amount) || undefined,
          final_payment_amount: parseFloat(formData.payment_terms.final_payment_amount) || undefined
        },
        delivery_info: formData.delivery_info,
        description: formData.description,
        notes: formData.notes,
        priority: formData.priority,
        draft_file: uploadedFile || undefined
      };

      await contractsAPI.createSalesContract(contractData);

      // 成功后回调
      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    } catch (err) {
      console.error('创建销售合同失败:', err);
      setError(err.response?.data?.message || '创建销售合同失败');
    } finally {
      setLoading(false);
    }
  };

  // 关闭对话框
  const handleClose = () => {
    if (!loading) {
      setFormData({
        contract_name: '',
        contract_amount: '',
        currency: 'CNY',
        signing_date: '',
        effective_date: '',
        expiry_date: '',
        counterparty: {
          name: '',
          company: '',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          address: ''
        },
        payment_terms: {
          method: '预付款+尾款',
          advance_payment_ratio: 30,
          advance_payment_amount: '',
          final_payment_amount: ''
        },
        delivery_info: {
          delivery_address: '',
          delivery_date: '',
          delivery_method: '物流',
          contact_person: '',
          contact_phone: ''
        },
        description: '',
        notes: '',
        priority: 'Normal'
      });
      setUploadedFile(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        创建销售合同
        <Typography variant="caption" display="block" color="text.secondary">
          项目：{project?.projectNumber} - {project?.projectName}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>基本信息</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="合同名称"
              value={formData.contract_name}
              onChange={(e) => handleChange('contract_name', e.target.value)}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              required
              label="合同金额"
              type="number"
              value={formData.contract_amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">¥</InputAdornment>
              }}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>币种</InputLabel>
              <Select
                value={formData.currency}
                label="币种"
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <MenuItem value="CNY">人民币 (CNY)</MenuItem>
                <MenuItem value="USD">美元 (USD)</MenuItem>
                <MenuItem value="EUR">欧元 (EUR)</MenuItem>
                <MenuItem value="JPY">日元 (JPY)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="签订日期"
              type="date"
              value={formData.signing_date}
              onChange={(e) => handleChange('signing_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="生效日期"
              type="date"
              value={formData.effective_date}
              onChange={(e) => handleChange('effective_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              fullWidth
              label="到期日期"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleChange('expiry_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 客户信息 */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>客户信息</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              required
              label="客户名称"
              value={formData.counterparty.name}
              onChange={(e) => handleChange('name', e.target.value, 'counterparty')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="客户公司"
              value={formData.counterparty.company}
              onChange={(e) => handleChange('company', e.target.value, 'counterparty')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="联系人"
              value={formData.counterparty.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value, 'counterparty')}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="联系电话"
              value={formData.counterparty.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value, 'counterparty')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="客户地址"
              value={formData.counterparty.address}
              onChange={(e) => handleChange('address', e.target.value, 'counterparty')}
            />
          </Grid>

          {/* 付款条款 */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>付款条款</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>付款方式</InputLabel>
              <Select
                value={formData.payment_terms.method}
                label="付款方式"
                onChange={(e) => handleChange('method', e.target.value, 'payment_terms')}
              >
                <MenuItem value="预付款+尾款">预付款+尾款</MenuItem>
                <MenuItem value="货到付款">货到付款</MenuItem>
                <MenuItem value="月结">月结</MenuItem>
                <MenuItem value="其他">其他</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.payment_terms.method === '预付款+尾款' && (
            <>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="预付款比例"
                  type="number"
                  value={formData.payment_terms.advance_payment_ratio}
                  onChange={(e) => handleAdvanceRatioChange(parseFloat(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="预付款金额"
                  type="number"
                  value={formData.payment_terms.advance_payment_amount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                    readOnly: true
                  }}
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="尾款金额"
                  type="number"
                  value={formData.payment_terms.final_payment_amount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                    readOnly: true
                  }}
                />
              </Grid>
            </>
          )}

          {/* 合同文件上传 */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>合同文件</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            {uploadedFile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon color="primary" />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {uploadedFile.file_name} ({formatFileSize(uploadedFile.file_size)})
                </Typography>
                <Button
                  size="small"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleRemoveFile}
                  disabled={loading}
                >
                  移除
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={uploadingFile ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={uploadingFile || loading}
              >
                {uploadingFile ? '上传中...' : '上传合同草稿（PDF、Word）'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              支持 PDF、Word 格式，最大 10MB
            </Typography>
          </Grid>

          {/* 备注 */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="备注说明"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="填写合同相关的备注信息..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || uploadingFile}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '提交中...' : '提交至合同中心'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSalesContractDialog;

