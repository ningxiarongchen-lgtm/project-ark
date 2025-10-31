import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const QualityInspectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [qualityCheck, setQualityCheck] = useState(null);
  const [checkList, setCheckList] = useState([]);
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, result: null });

  // 获取质检任务详情和加载检验模板
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // 获取质检任务详情
        const checkResponse = await axios.get(`${API_BASE_URL}/quality-checks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const checkData = checkResponse.data;
        setQualityCheck(checkData);
        
        // 如果已有检验清单，使用现有的；否则从模板加载
        if (checkData.checkList && checkData.checkList.length > 0) {
          setCheckList(checkData.checkList);
          setImages(checkData.images || []);
          setNotes(checkData.notes || '');
        } else {
          // 尝试根据产品系列和检验类型加载模板
          const productSeries = checkData.itemsToCheck?.[0]?.model?.split('-')[0] || 'AT';
          
          try {
            const templateResponse = await axios.get(
              `${API_BASE_URL}/quality-checks/templates/${checkData.checkType}/${productSeries}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // 将模板项转换为检验清单项
            const templateItems = templateResponse.data.items.map(item => ({
              itemName: item.itemName,
              standard: item.standard,
              result: 'N/A',
              notes: ''
            }));
            
            setCheckList(templateItems);
          } catch (err) {
            console.warn('未找到检验模板，使用默认检验项:', err);
            // 使用默认检验项
            setCheckList(getDefaultCheckList(checkData.checkType));
          }
        }
      } catch (err) {
        console.error('获取质检任务失败:', err);
        setError(err.response?.data?.message || '获取质检任务失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 获取默认检验清单
  const getDefaultCheckList = (checkType) => {
    if (checkType === 'IQC') {
      return [
        { itemName: '外观检查', standard: '无划痕、锈蚀、变形', result: 'N/A', notes: '' },
        { itemName: '数量核对', standard: '与采购单数量一致', result: 'N/A', notes: '' },
        { itemName: '标识检查', standard: '标签清晰、规格正确', result: 'N/A', notes: '' },
        { itemName: '包装检查', standard: '包装完好、无破损', result: 'N/A', notes: '' }
      ];
    } else if (checkType === 'FQC') {
      return [
        { itemName: '外观检查', standard: '表面光洁、无划痕', result: 'N/A', notes: '' },
        { itemName: '尺寸检验', standard: '符合图纸要求±0.1mm', result: 'N/A', notes: '' },
        { itemName: '气密性测试', standard: '5分钟压力下降<0.1%', result: 'N/A', notes: '' },
        { itemName: '动作测试', standard: '开关动作顺畅、无卡滞', result: 'N/A', notes: '' },
        { itemName: '扭矩测试', standard: '符合规格要求', result: 'N/A', notes: '' },
        { itemName: '标识检查', standard: '铭牌清晰、信息准确', result: 'N/A', notes: '' }
      ];
    }
    return [
      { itemName: '外观检查', standard: '无明显缺陷', result: 'N/A', notes: '' }
    ];
  };

  // 更新检验项结果
  const handleResultChange = (index, field, value) => {
    const newCheckList = [...checkList];
    newCheckList[index][field] = value;
    setCheckList(newCheckList);
  };

  // 上传图片
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    // 这里应该上传到服务器并获取URL，为了演示，使用本地URL
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 删除图片
  const handleImageDelete = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 计算检验结果统计
  const getCheckStats = () => {
    const pass = checkList.filter(item => item.result === 'Pass').length;
    const fail = checkList.filter(item => item.result === 'Fail').length;
    const na = checkList.filter(item => item.result === 'N/A').length;
    return { pass, fail, na, total: checkList.length };
  };

  // 判定是否可以提交
  const canSubmit = () => {
    const stats = getCheckStats();
    return stats.na === 0; // 所有项目都必须有结果
  };

  // 打开确认对话框
  const handleOpenConfirmDialog = (result) => {
    if (!canSubmit()) {
      setError('请完成所有检验项的判定');
      return;
    }
    setConfirmDialog({ open: true, result });
  };

  // 提交检验结果
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const { result } = confirmDialog;
      
      await axios.post(
        `${API_BASE_URL}/quality-checks/${id}/complete`,
        {
          checkList,
          overallResult: result,
          images,
          notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 跳转回工作台
      navigate('/quality/dashboard', {
        state: { message: `检验任务已完成，判定结果: ${result === 'Pass' ? '合格' : '不合格'}` }
      });
    } catch (err) {
      console.error('提交检验结果失败:', err);
      setError(err.response?.data?.message || '提交检验结果失败');
    } finally {
      setSubmitting(false);
      setConfirmDialog({ open: false, result: null });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!qualityCheck) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">质检任务不存在</Alert>
      </Container>
    );
  }

  const stats = getCheckStats();
  const isCompleted = qualityCheck.status === 'Completed';

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/quality/dashboard')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isCompleted ? '质检报告' : '执行检验'}
          </Typography>
        </Box>
        {isCompleted && qualityCheck.overallResult && (
          <Chip
            icon={qualityCheck.overallResult === 'Pass' ? <CheckCircleIcon /> : <CancelIcon />}
            label={qualityCheck.overallResult === 'Pass' ? '检验合格' : '检验不合格'}
            color={qualityCheck.overallResult === 'Pass' ? 'success' : 'error'}
            size="large"
          />
        )}
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 基础信息卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                检验单号
              </Typography>
              <Typography variant="h6">{qualityCheck.checkNumber}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                检验类型
              </Typography>
              <Chip label={qualityCheck.checkType} color="primary" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                来源单号
              </Typography>
              <Typography variant="h6">{qualityCheck.sourceDocument?.number || '-'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                检验数量
              </Typography>
              <Typography variant="h6">
                {qualityCheck.itemsToCheck?.reduce((sum, item) => sum + (item.quantity || 0), 0)} 件
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 待检产品信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          待检物料/产品
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>型号</TableCell>
                <TableCell align="center">数量</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qualityCheck.itemsToCheck?.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.model}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 检验进度统计 */}
      {!isCompleted && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <InfoIcon color="info" />
            </Grid>
            <Grid item xs>
              <Typography variant="body2">
                检验进度: {stats.pass + stats.fail} / {stats.total} 项已完成
                {stats.na > 0 && ` (还有 ${stats.na} 项待检)`}
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`合格: ${stats.pass}`} color="success" size="small" />
                <Chip label={`不合格: ${stats.fail}`} color="error" size="small" />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 检验项目列表 */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">检验项目清单</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="5%">序号</TableCell>
                <TableCell width="20%">检验项目</TableCell>
                <TableCell width="25%">检验标准</TableCell>
                <TableCell width="25%">检验结果</TableCell>
                <TableCell width="25%">备注</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checkList.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.itemName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {item.standard}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {isCompleted ? (
                      <Chip
                        label={item.result === 'Pass' ? '合格' : item.result === 'Fail' ? '不合格' : 'N/A'}
                        color={item.result === 'Pass' ? 'success' : item.result === 'Fail' ? 'error' : 'default'}
                        size="small"
                      />
                    ) : (
                      <FormControl component="fieldset">
                        <RadioGroup
                          row
                          value={item.result}
                          onChange={(e) => handleResultChange(index, 'result', e.target.value)}
                        >
                          <FormControlLabel value="Pass" control={<Radio color="success" />} label="合格" />
                          <FormControlLabel value="Fail" control={<Radio color="error" />} label="不合格" />
                          <FormControlLabel value="N/A" control={<Radio />} label="N/A" />
                        </RadioGroup>
                      </FormControl>
                    )}
                  </TableCell>
                  <TableCell>
                    {isCompleted ? (
                      <Typography variant="body2">{item.notes || '-'}</Typography>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="备注"
                        value={item.notes}
                        onChange={(e) => handleResultChange(index, 'notes', e.target.value)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 现场照片 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          现场照片
        </Typography>
        {!isCompleted && (
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
          >
            上传照片
            <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
          </Button>
        )}
        {images.length > 0 ? (
          <ImageList cols={4} gap={8}>
            {images.map((image, index) => (
              <ImageListItem key={index}>
                <img src={image} alt={`现场照片 ${index + 1}`} loading="lazy" />
                {!isCompleted && (
                  <ImageListItemBar
                    actionIcon={
                      <IconButton
                        sx={{ color: 'white' }}
                        onClick={() => handleImageDelete(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  />
                )}
              </ImageListItem>
            ))}
          </ImageList>
        ) : (
          <Typography color="textSecondary">暂无照片</Typography>
        )}
      </Paper>

      {/* 综合结论 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          综合结论
        </Typography>
        {isCompleted ? (
          <Typography variant="body1">{notes || '无'}</Typography>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="请填写综合结论..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
      </Paper>

      {/* 最终判定按钮 */}
      {!isCompleted && (
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom align="center">
            最终判定
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleOpenConfirmDialog('Pass')}
              disabled={!canSubmit() || submitting}
              sx={{ minWidth: 150 }}
            >
              判定合格
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<CancelIcon />}
              onClick={() => handleOpenConfirmDialog('Fail')}
              disabled={!canSubmit() || submitting}
              sx={{ minWidth: 150 }}
            >
              判定不合格
            </Button>
          </Box>
          {!canSubmit() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              请完成所有检验项的判定后再提交
            </Alert>
          )}
        </Paper>
      )}

      {/* 确认对话框 */}
      <Dialog open={confirmDialog.open} onClose={() => !submitting && setConfirmDialog({ open: false, result: null })}>
        <DialogTitle>
          确认检验结果
        </DialogTitle>
        <DialogContent>
          <Typography>
            您确定要将本次检验判定为
            <strong style={{ color: confirmDialog.result === 'Pass' ? 'green' : 'red' }}>
              {confirmDialog.result === 'Pass' ? '合格' : '不合格'}
            </strong>
            吗？
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            判定结果提交后将自动更新相关单据状态，该操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, result: null })} disabled={submitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={confirmDialog.result === 'Pass' ? 'success' : 'error'}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : '确认提交'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QualityInspectionPage;

