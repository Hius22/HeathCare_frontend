import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LANGUAGES } from '../../utils';
import { getNotifications, getNotificationsDoctor } from '../../services/userService';
import './NotificationDropdown.scss';

const STORAGE_KEY_PREFIX = 'hcare_read_notifs_';

class NotificationDropdown extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            notifications: [],
            readIds: new Set(),
            loading: false,
        };
        this.dropdownRef = React.createRef();
        this.pollInterval = null;
    }

    componentDidMount() {
        this.loadReadIds();
        this.fetchNotifications();
        this.pollInterval = setInterval(this.fetchNotifications, 30000);
        document.addEventListener('mousedown', this.handleOutsideClick);
    }

    componentWillUnmount() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        document.removeEventListener('mousedown', this.handleOutsideClick);
    }

    getStorageKey = () => {
        const { userInfo } = this.props;
        return STORAGE_KEY_PREFIX + (userInfo ? userInfo.id : 'anon');
    }

    loadReadIds = () => {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            if (raw) {
                this.setState({ readIds: new Set(JSON.parse(raw)) });
            }
        } catch (e) { }
    }

    saveReadIds = (readIds) => {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify([...readIds]));
        } catch (e) { }
    }

    fetchNotifications = async () => {
        const { role, userInfo } = this.props;
        try {
            let res;
            if (role === 'doctor' && userInfo && userInfo.id) {
                res = await getNotificationsDoctor(userInfo.id);
            } else {
                res = await getNotifications();
            }
            if (res && res.errCode === 0) {
                this.setState({ notifications: res.data || [] });
            }
        } catch (e) {
            console.log('Fetch notifications error:', e);
        }
    }

    handleOutsideClick = (e) => {
        if (this.dropdownRef.current && !this.dropdownRef.current.contains(e.target)) {
            this.setState({ isOpen: false });
        }
    }

    toggleOpen = () => {
        this.setState(prev => ({ isOpen: !prev.isOpen }));
        if (!this.state.isOpen) {
            this.fetchNotifications();
        }
    }

    markAsRead = (id) => {
        this.setState(prev => {
            const newReadIds = new Set(prev.readIds);
            newReadIds.add(id);
            this.saveReadIds(newReadIds);
            return { readIds: newReadIds };
        });
    }

    markAllRead = () => {
        const { notifications } = this.state;
        const allIds = new Set(notifications.map(n => n.id));
        this.saveReadIds(allIds);
        this.setState({ readIds: allIds });
    }

    getUnreadCount = () => {
        const { notifications, readIds } = this.state;
        return notifications.filter(n => !readIds.has(n.id)).length;
    }

    formatTime = (createdAt) => {
        if (!createdAt) return '';
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        const { language } = this.props;
        const isVi = language === LANGUAGES.VI;

        if (diffMins < 1) return isVi ? 'Vừa xong' : 'Just now';
        if (diffMins < 60) return isVi ? `${diffMins} phút trước` : `${diffMins}m ago`;
        if (diffHours < 24) return isVi ? `${diffHours} giờ trước` : `${diffHours}h ago`;
        if (diffDays < 7) return isVi ? `${diffDays} ngày trước` : `${diffDays}d ago`;
        return created.toLocaleDateString('vi-VN');
    }

    getTypeColor = (type) => {
        const map = {
            'new-booking': '#3b82f6',
            'new-patient': '#3b82f6',
            'confirmed': '#10b981',
            'patient-confirmed': '#10b981',
            'completed': '#6366f1',
            'cancelled': '#ef4444',
            'other': '#f59e0b',
        };
        return map[type] || '#94a3b8';
    }

    render() {
        const { isOpen, notifications, readIds, loading } = this.state;
        const { language } = this.props;
        const isVi = language === LANGUAGES.VI;
        const unreadCount = this.getUnreadCount();

        return (
            <div className="notification-wrapper" ref={this.dropdownRef}>
                {/* Bell Button */}
                <div
                    className={`notification-bell ${isOpen ? 'active' : ''}`}
                    onClick={this.toggleOpen}
                    title={isVi ? 'Thông báo' : 'Notifications'}
                >
                    <i className={`${unreadCount > 0 ? 'fas' : 'far'} fa-bell ${unreadCount > 0 ? 'bell-ring' : ''}`}></i>
                    {unreadCount > 0 && (
                        <span className="notif-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>

                {/* Dropdown Panel */}
                {isOpen && (
                    <div className="notification-dropdown">
                        {/* Header */}
                        <div className="notif-header">
                            <div className="notif-header-left">
                                <span className="notif-title">
                                    {isVi ? 'Thông báo' : 'Notifications'}
                                </span>
                                {unreadCount > 0 && (
                                    <span className="notif-count-pill">{unreadCount} {isVi ? 'mới' : 'new'}</span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button className="mark-all-btn" onClick={this.markAllRead}>
                                    <i className="fas fa-check-double"></i>
                                    {isVi ? 'Đọc tất cả' : 'Mark all read'}
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="notif-list">
                            {loading && (
                                <div className="notif-loading">
                                    <i className="fas fa-spinner fa-spin"></i>
                                </div>
                            )}
                            {!loading && notifications.length === 0 && (
                                <div className="notif-empty">
                                    <i className="far fa-bell-slash"></i>
                                    <p>{isVi ? 'Chưa có thông báo nào' : 'No notifications yet'}</p>
                                </div>
                            )}
                            {!loading && notifications.map((notif) => {
                                const isRead = readIds.has(notif.id);
                                const color = this.getTypeColor(notif.type);
                                const title = isVi ? notif.titleVi : notif.titleEn;
                                const desc = isVi ? notif.descVi : notif.descEn;
                                return (
                                    <div
                                        key={notif.id}
                                        className={`notif-item ${isRead ? 'read' : 'unread'} ${notif.isToday ? 'today' : ''}`}
                                        onClick={() => this.markAsRead(notif.id)}
                                    >
                                        <div
                                            className="notif-icon-wrap"
                                            style={{ background: `${color}18`, color: color }}
                                        >
                                            <i className={notif.icon}></i>
                                        </div>
                                        <div className="notif-content">
                                            <div className="notif-item-header">
                                                <span className="notif-item-title">{title}</span>
                                                {!isRead && <span className="unread-dot"></span>}
                                            </div>
                                            <p className="notif-desc">{desc}</p>
                                            <span className="notif-time">
                                                <i className="far fa-clock"></i>
                                                {this.formatTime(notif.createdAt)}
                                                {notif.isToday && (
                                                    <span className="today-badge">
                                                        {isVi ? 'Hôm nay' : 'Today'}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="notif-footer">
                                <button className="refresh-btn" onClick={this.fetchNotifications}>
                                    <i className="fas fa-sync-alt"></i>
                                    {isVi ? 'Làm mới' : 'Refresh'}
                                </button>
                                <span className="notif-total">
                                    {notifications.length} {isVi ? 'thông báo' : 'notifications'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

const mapStateToProps = state => ({
    language: state.app.language,
    userInfo: state.user.userInfo,
});

export default connect(mapStateToProps)(NotificationDropdown);
