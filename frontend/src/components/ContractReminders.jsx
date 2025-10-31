import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Badge,
  Box,
  Divider,
  Collapse,
  Button,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../services/api';

const ContractReminders = ({ onNavigateToContract }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState(null);

  // 加载提醒
  const loadReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const [remindersRes, statsRes] = await Promise.all([
        api.get('/reminders'),
        api.get('/reminders/stats').catch(() => ({ data: { data: null } }))
      ]);

      setReminders(remindersRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('加载提醒失败:', err);
      setError('加载提醒失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();

    // 每5分钟刷新一次
    const interval = setInterval(loadReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 关闭提醒
  const handleDismiss = async (contractId, type) => {
    try {
      await api.delete(`/reminders/${contractId}/${type}`);
      setReminders(reminders.filter(
        r => !(r.contract_id === contractId && r.type === type)
      ));
    } catch (err) {
      console.error('关闭提醒失败:', err);
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  // 获取优先级图标
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ErrorIcon />;
      case 'medium':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // 获取提醒类型图标
  const getTypeIcon = (type) => {
    switch (type) {
      case 'contract_expiring':
        return <AccessTimeIcon />;
      case 'contract_pending_long':
        return <DescriptionIcon />;
      case 'payment_overdue':
        return <AttachMoneyIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  // 获取提醒类型标签
  const getTypeLabel = (type) => {
    const labels = {
      'contract_expiring': '即将到期',
      'contract_pending_long': '待处理过久',
      'payment_overdue': '付款逾期'
    };
    return labels[type] || type;
  };

  // 高优先级提醒
  const highPriorityReminders = reminders.filter(r => r.priority === 'high');
  const mediumPriorityReminders = reminders.filter(r => r.priority === 'medium');

  if (reminders.length === 0) {
    return null; // 没有提醒时不显示
  }

  return (
    <Card sx={{ mb: 3, border: highPriorityReminders.length > 0 ? '2px solid #f44336' : 'none' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Badge badgeContent={reminders.length} color="error" sx={{ flex: 1 }}>
            <NotificationsIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h6" component="span">
              合同提醒
            </Typography>
          </Badge>
          <Tooltip title="刷新">
            <IconButton size="small" onClick={loadReminders} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {stats && (
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Chip
              label={`高优先级: ${stats.high}`}
              color="error"
              size="small"
              variant={stats.high > 0 ? 'filled' : 'outlined'}
            />
            <Chip
              label={`中优先级: ${stats.medium}`}
              color="warning"
              size="small"
              variant={stats.medium > 0 ? 'filled' : 'outlined'}
            />
          </Box>
        )}

        <Collapse in={expanded}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Typography color="text.secondary" align="center">
              加载中...
            </Typography>
          ) : (
            <List disablePadding>
              {/* 高优先级提醒 */}
              {highPriorityReminders.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                    ⚠️ 紧急提醒
                  </Typography>
                  {highPriorityReminders.map((reminder, index) => (
                    <React.Fragment key={`${reminder.contract_id}_${reminder.type}_${index}`}>
                      <ListItem
                        sx={{
                          bgcolor: 'error.lighter',
                          borderRadius: 1,
                          mb: 1
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDismiss(reminder.contract_id, reminder.type)}
                          >
                            <CloseIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          {getTypeIcon(reminder.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {reminder.contract_number}
                              </Typography>
                              <Chip
                                label={getTypeLabel(reminder.type)}
                                color={getPriorityColor(reminder.priority)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.primary">
                                {reminder.message}
                              </Typography>
                              {reminder.type === 'contract_expiring' && (
                                <Typography variant="caption" color="error.main">
                                  到期日期: {format(new Date(reminder.expiry_date), 'yyyy-MM-dd', { locale: zhCN })}
                                </Typography>
                              )}
                              {reminder.type === 'payment_overdue' && reminder.payment_amount && (
                                <Typography variant="caption" color="error.main">
                                  应付金额: ¥{reminder.payment_amount.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {onNavigateToContract && (
                        <Button
                          size="small"
                          onClick={() => onNavigateToContract(reminder.contract_id)}
                          sx={{ ml: 7, mb: 1 }}
                        >
                          查看详情
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                  {mediumPriorityReminders.length > 0 && <Divider sx={{ my: 2 }} />}
                </>
              )}

              {/* 中优先级提醒 */}
              {mediumPriorityReminders.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                    ℹ️ 一般提醒
                  </Typography>
                  {mediumPriorityReminders.map((reminder, index) => (
                    <React.Fragment key={`${reminder.contract_id}_${reminder.type}_${index}`}>
                      <ListItem
                        sx={{
                          bgcolor: 'warning.lighter',
                          borderRadius: 1,
                          mb: 1
                        }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDismiss(reminder.contract_id, reminder.type)}
                          >
                            <CloseIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          {getTypeIcon(reminder.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {reminder.contract_number}
                              </Typography>
                              <Chip
                                label={getTypeLabel(reminder.type)}
                                color={getPriorityColor(reminder.priority)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2">
                              {reminder.message}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {onNavigateToContract && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onNavigateToContract(reminder.contract_id)}
                          sx={{ ml: 7, mb: 1 }}
                        >
                          查看详情
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
            </List>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ContractReminders;

