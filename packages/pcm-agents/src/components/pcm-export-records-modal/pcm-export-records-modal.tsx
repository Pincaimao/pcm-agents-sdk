import { Component, Prop, State, h, Watch, Event, EventEmitter } from '@stencil/core';
import { getCosPresignedUrl, sendHttpRequest } from '../../utils/utils';

interface ExportRecord {
  id: string;
  file_name: string;
  status: number;
  created_at: string;
  cos_key?: string;
}

interface PaginationType {
  page: number;
  size: number;
  total?: number;
}

const DEFAULT_PAGINATION = {
  page: 1,
  size: 10,
};

const EXPORT_BATCH_STATUS_MAP: Record<string, { text: string; color: string }> = {
  '0': { text: '处理中', color: '#1890ff' },
  '1': { text: '已完成', color: '#52c41a' },
  '-1': { text: '失败', color: '#ff4d4f' },
};

@Component({
  tag: 'pcm-export-records-modal',
  styleUrl: 'pcm-export-records-modal.css',
  shadow: true,
})
export class PcmExportRecordsModal {
  @Prop() botId?: string;
  @Prop() sourceId?: string;
  @Prop() open: boolean = false;
  @Event() cancel: EventEmitter<void>;

  @State() loading: boolean = true;
  @State() pagination: PaginationType = DEFAULT_PAGINATION;
  @State() data: ExportRecord[] = [];
  @State() showMessage: boolean = false;
  @State() messageText: string = '';
  @State() messageType: 'success' | 'error' = 'success';

  @Watch('open')
  watchOpen(newValue: boolean) {
    if (newValue) {
      this.fetchData(this.pagination);
    }
  }

  private async fetchData(p: PaginationType) {
    this.loading = true;
    try {
      // 模拟API调用
      const response = await sendHttpRequest({
        url: '/sdk/v1/export_batch/page',
        method: 'GET',
        params: {
          page: p.page,
          size: p.size,
          bot_id: this.botId,
          source_id: this.sourceId,
        },
      });
      if (response.success && response.data) {
        const records = response?.data?.records ?? [];
        this.data = records;
        this.pagination = {
          ...p,
          total: response?.data?.total ?? 0,
        };
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleDownload(record: ExportRecord) {
    try {
      const downloadUrl = await getCosPresignedUrl(record.cos_key);
      const fileName = record.file_name;
      if (downloadUrl) {
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          this.showMessageToast('下载成功', 'success');
      } else {
          this.showMessageToast('获取下载链接失败', 'error');
      }
      
    } catch (error) {
      this.showMessageToast('下载失败', 'error');
    }
  }

  private async handleDelete(record: ExportRecord) {
    try {
      const response = await sendHttpRequest({
        url: `/sdk/v1/export_batch/delete/${record.id}`,
        method: "DELETE",
      });
      if (response?.success) {
        this.showMessageToast('删除成功', 'success');
        setTimeout(() => {
          this.fetchData(this.pagination);
        }, 100);
      }
    } catch (error) {
      this.showMessageToast(`删除失败: ${error.message}`, 'error');
    }
  }

  private showMessageToast(text: string, type: 'success' | 'error') {
    this.messageText = text;
    this.messageType = type;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 3000);
  }

  private handleRefresh = () => {
    this.fetchData(this.pagination);
  };

  private handlePageChange = (page: number, size: number) => {
    const newPagination = {
      ...this.pagination,
      page,
      size,
    };
    this.fetchData(newPagination);
  };

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private renderEmpty() {
    return (
      <div class="empty-container">
        <div class="empty-icon">📄</div>
        <div class="empty-text">暂无任务</div>
      </div>
    );
  }

  private renderTag(status: number) {
    const statusInfo = EXPORT_BATCH_STATUS_MAP[status.toString()] || { text: '未知', color: '#d9d9d9' };
    return (
      <span class="tag" style={{ backgroundColor: statusInfo.color }}>
        {statusInfo.text}
      </span>
    );
  }

  private renderButton(text: string, onClick: () => void, variant: 'primary' | 'default' | 'danger' = 'default', size: 'small' | 'medium' = 'medium') {
    return (
      <button
        class={`btn btn-${variant} btn-${size}`}
        onClick={onClick}
      >
        {text}
      </button>
    );
  }

  private renderTable() {
    if (this.loading) {
      return (
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div>加载中...</div>
        </div>
      );
    }

    if (!this.data || this.data.length === 0) {
      return this.renderEmpty();
    }

    return (
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th style={{ width: '300px', textAlign: 'center' }}>文件名</th>
              <th style={{ width: '100px', textAlign: 'center' }}>状态</th>
              <th style={{ width: '180px', textAlign: 'center' }}>创建时间</th>
              <th style={{ width: '100px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {this.data.map((record) => (
              <tr key={record.id}>
                <td style={{ textAlign: 'center' }}>{record.file_name}</td>
                <td style={{ textAlign: 'center' }}>
                  {this.renderTag(record.status)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {this.formatDate(record.created_at)}
                </td>
                <td style={{ textAlign: 'left' }}>
                  <div class="action-buttons">
                    {record.status !== 0 && this.renderButton(
                      '删除',
                      () => this.handleDelete(record),
                      'danger',
                      'small'
                    )}
                    {record.cos_key && this.renderButton(
                      '下载',
                      () => this.handleDownload(record),
                      'primary',
                      'small'
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  private renderPagination() {
    if (!this.pagination.total || this.pagination.total === 0) {
      return null;
    }

    const totalPages = Math.ceil(this.pagination.total / this.pagination.size);
    const currentPage = this.pagination.page;

    return (
      <div class="pagination-container">
        <div class="pagination-info">
          共{this.pagination.total}条
        </div>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            disabled={currentPage <= 1}
            onClick={() => this.handlePageChange(currentPage - 1, this.pagination.size)}
          >
            上一页
          </button>
          <span class="pagination-current">
            {currentPage} / {totalPages}
          </span>
          <button
            class="pagination-btn"
            disabled={currentPage >= totalPages}
            onClick={() => this.handlePageChange(currentPage + 1, this.pagination.size)}
          >
            下一页
          </button>
          <select
            class="pagination-size-select"
            onChange={(e) => this.handlePageChange(1, parseInt((e.target as HTMLSelectElement).value))}
          >
            <option value="10" selected={this.pagination.size === 10}>10条/页</option>
            <option value="20" selected={this.pagination.size === 20}>20条/页</option>
            <option value="50" selected={this.pagination.size === 50}>50条/页</option>
          </select>
        </div>
      </div>
    );
  }

  private renderMessage() {
    if (!this.showMessage) return null;

    return (
      <div class={`message message-${this.messageType}`}>
        {this.messageText}
      </div>
    );
  }

  render() {
    if (!this.open) {
      return null;
    }

    return (
      <div class="modal-overlay" onClick={() => this.cancel.emit()}>
        <div class="modal-container" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <div class="modal-title">
              <span>导出任务列表</span>
              {this.renderButton(
                '🔄 刷新',
                this.handleRefresh,
                'default',
                'small'
              )}
            </div>
            <button class="modal-close" onClick={() => this.cancel.emit()}>
              ✕
            </button>
          </div>
          <div class="modal-body">
            {this.renderTable()}
            {this.renderPagination()}
          </div>
          {this.renderMessage()}
        </div>
      </div>
    );
  }
}