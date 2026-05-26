import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import HomeHeader from "../HomePage/HomeHeader";
import HomeFooter from "../HomePage/HomeFooter";
import "./BookingHistory.scss";
import moment from 'moment';
import { getAllBookings, postCancelBooking } from "../../services/userService";
import { toast } from "react-toastify";

class BookingHistory extends Component {

    constructor(props) {
        super(props);
        this.state = {
            bookings: [],
            activeTab: 'all',
            searchEmail: '',
            hasSearched: false,
            isLoading: false
        };
    }

    componentDidMount() {
        const user = this.props.userInfo;
        if (user?.id) {
            this.getBookingHistory(user.id);
        }
    }

    componentDidUpdate(prevProps) {
        const oldId = prevProps.userInfo?.id;
        const newId = this.props.userInfo?.id;
        if (oldId !== newId && newId) {
            this.getBookingHistory(newId);
        }
    }

    getBookingHistory = async (userId) => {
        if (!userId) return;
        this.setState({ isLoading: true });
        try {
            let res = await getAllBookings({ patientId: userId });
            if (res && res.errCode === 0) {
                this.setState({ bookings: res.data || [], hasSearched: true });
            }
        } catch (e) {
            console.error("API ERROR:", e);
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleSearchEmail = async () => {
        const { searchEmail } = this.state;
        if (!searchEmail.trim()) {
            toast.error("Vui lòng nhập email để tra cứu!");
            return;
        }
        this.setState({ isLoading: true });
        try {
            let res = await getAllBookings({ patientEmail: searchEmail.trim() });
            if (res && res.errCode === 0) {
                this.setState({ bookings: res.data || [], hasSearched: true, activeTab: 'all' });
                if (!res.data || res.data.length === 0) {
                    toast.info("Không tìm thấy lịch hẹn nào với email này.");
                } else {
                    toast.success(`Tìm thấy ${res.data.length} lịch hẹn!`);
                }
            } else {
                toast.error("Tra cứu thất bại!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Lỗi kết nối máy chủ!");
        } finally {
            this.setState({ isLoading: false });
        }
    };

    handleCancelBooking = async (item) => {
        let isConfirm = window.confirm(
            `Bạn có chắc chắn muốn hủy lịch hẹn với bác sĩ ${item.doctorData?.lastName} ${item.doctorData?.firstName} vào ngày ${this.formatDate(item.date)} không?`
        );
        if (isConfirm) {
            try {
                let res = await postCancelBooking({
                    doctorId: item.doctorId,
                    patientId: item.patientId,
                    timeType: item.timeType,
                    date: item.date
                });
                if (res && res.errCode === 0) {
                    toast.success("Hủy lịch hẹn thành công!");
                    // Refresh
                    if (this.props.userInfo?.id) {
                        this.getBookingHistory(this.props.userInfo.id);
                    } else if (this.state.searchEmail) {
                        this.handleSearchEmail();
                    }
                } else {
                    toast.error(res?.errMessage || "Hủy lịch hẹn thất bại!");
                }
            } catch (e) {
                toast.error("Có lỗi xảy ra từ máy chủ!");
            }
        }
    };

    handleTabChange = (tab) => {
        this.setState({ activeTab: tab });
    };

    formatDate = (timestamp) => {
        const date = moment(+timestamp);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayOfWeek = days[date.day()];
        const fullDate = date.format('DD/MM/YYYY');
        return `${dayOfWeek}, ${fullDate}`;
    };

    getStatusLabel = (statusId) => {
        const map = { S1: 'Chờ xác nhận', S2: 'Đã xác nhận', S3: 'Đã khám', S4: 'Đã hủy' };
        return map[statusId] || statusId;
    };

    getFilteredBookings = () => {
        const { bookings, activeTab } = this.state;
        const now = moment().startOf('day');

        if (activeTab === 'all') return bookings;

        if (activeTab === 'upcoming') {
            return bookings.filter(item =>
                (item.statusId === 'S1' || item.statusId === 'S2') &&
                moment(+item.date).startOf('day').isSameOrAfter(now)
            );
        }
        if (activeTab === 'past') {
            return bookings.filter(item =>
                item.statusId === 'S3' ||
                (item.statusId === 'S2' && moment(+item.date).startOf('day').isBefore(now))
            );
        }
        if (activeTab === 'cancelled') {
            return bookings.filter(item => item.statusId === 'S4');
        }
        return [];
    };

    render() {
        const { activeTab, bookings, hasSearched, isLoading, searchEmail } = this.state;
        const filteredBookings = this.getFilteredBookings();

        const countAll = bookings.length;
        const now = moment().startOf('day');
        const countUpcoming = bookings.filter(item =>
            (item.statusId === 'S1' || item.statusId === 'S2') &&
            moment(+item.date).startOf('day').isSameOrAfter(now)
        ).length;
        const countPast = bookings.filter(item =>
            item.statusId === 'S3' || (item.statusId === 'S2' && moment(+item.date).startOf('day').isBefore(now))
        ).length;
        const countCancelled = bookings.filter(item => item.statusId === 'S4').length;

        return (
            <React.Fragment>
                <HomeHeader isShowBanner={false} />

                <div className="booking-history-container">
                    {/* Breadcrumb */}
                    <nav className="breadcrumb">
                        <a href="/home">Trang chủ</a>
                        <i className="fa-solid fa-chevron-right"></i>
                        <span className="current">Lịch hẹn của tôi</span>
                    </nav>

                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">Lịch hẹn của tôi</h1>
                        <p className="page-description">
                            Tra cứu và quản lý lịch hẹn khám bệnh của bạn.
                        </p>
                    </div>

                    {/* Search Form - Always visible */}
                    <div className="search-container" style={{
                        marginBottom: '24px', padding: '24px',
                        background: '#f0f7ff', borderRadius: '12px',
                        border: '1px solid #cce5ff'
                    }}>
                        <h3 style={{ fontSize: '17px', marginBottom: '12px', color: '#1a5fbc', fontWeight: 600 }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 8 }}></i>
                            Tra cứu lịch khám bằng Email
                        </h3>
                        <p style={{ fontSize: '14px', color: '#555', marginBottom: '14px' }}>
                            Nhập email bạn đã dùng khi đặt lịch khám để xem danh sách lịch hẹn.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                type="email"
                                placeholder="Ví dụ: patient@email.com"
                                value={searchEmail}
                                onChange={(e) => this.setState({ searchEmail: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && this.handleSearchEmail()}
                                style={{
                                    padding: '10px 15px', flex: '1', minWidth: '260px',
                                    borderRadius: '6px', border: '1px solid #a8cfff',
                                    fontSize: '14px', outline: 'none'
                                }}
                            />
                            <button
                                onClick={this.handleSearchEmail}
                                disabled={isLoading}
                                style={{
                                    padding: '10px 24px', background: '#1a73e8',
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                            >
                                {isLoading ? 'Đang tìm...' : 'Tra cứu'}
                            </button>
                        </div>
                    </div>

                    {/* Show content only after search or login */}
                    {!hasSearched ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <i className="fa-solid fa-calendar-heart"></i>
                            </div>
                            <h3 className="empty-title">Chưa có dữ liệu</h3>
                            <p className="empty-description">
                                Nhập email của bạn ở ô bên trên để tra cứu lịch hẹn đã đặt.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="tabs-container">
                                <button
                                    className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('all')}
                                >
                                    Tất cả ({countAll})
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('upcoming')}
                                >
                                    Sắp tới ({countUpcoming})
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('past')}
                                >
                                    Đã khám ({countPast})
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
                                    onClick={() => this.handleTabChange('cancelled')}
                                >
                                    Đã hủy ({countCancelled})
                                </button>
                            </div>

                            {/* Content */}
                            <div className="appointments-content">
                                {filteredBookings.length > 0 ? (
                                    <div className="appointments-grid">
                                        {filteredBookings.map((item, index) => (
                                            <div className="appointment-card" key={index}>
                                                <div className="card-content">
                                                    {/* Doctor Image */}
                                                    <div className="doctor-image">
                                                        {item.doctorData?.image ? (
                                                            <img
                                                                src={item.doctorData.image}
                                                                alt={`BS. ${item.doctorData?.firstName}`}
                                                            />
                                                        ) : (
                                                            <div className="doctor-avatar">
                                                                {(item.doctorData?.lastName?.charAt(0) || '') + (item.doctorData?.firstName?.charAt(0) || '')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Appointment Info */}
                                                    <div className="appointment-info">
                                                        <div className="info-header">
                                                            <div>
                                                                <h3 className="doctor-name">
                                                                    BS. {item.doctorData?.lastName} {item.doctorData?.firstName}
                                                                </h3>
                                                                <p className="doctor-specialty">
                                                                    {item.doctorData?.specialtyData?.name || 'Chuyên khoa'}
                                                                </p>
                                                            </div>
                                                            <span className={`status-badge ${item.statusId}`}>
                                                                {item.statusData?.valueVi || this.getStatusLabel(item.statusId)}
                                                            </span>
                                                        </div>

                                                        <div className="appointment-details">
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-calendar-days"></i>
                                                                <span>{this.formatDate(item.date)}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-clock"></i>
                                                                <span>{item.timeTypeDataPatient?.valueVi || item.timeType}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <i className="fa-solid fa-user"></i>
                                                                <span>{item.patientData?.firstName || 'Bệnh nhân'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        {(item.statusId === 'S1' || item.statusId === 'S2') &&
                                                            moment(+item.date).startOf('day').isSameOrAfter(moment().startOf('day')) && (
                                                            <div className="card-actions">
                                                                <button
                                                                    className="btn-reschedule"
                                                                    onClick={() => toast.info("Để đổi lịch, vui lòng hủy lịch này và đặt lịch mới.")}
                                                                >
                                                                    Đổi lịch
                                                                </button>
                                                                <button
                                                                    className="btn-cancel"
                                                                    onClick={() => this.handleCancelBooking(item)}
                                                                >
                                                                    Hủy lịch
                                                                </button>
                                                            </div>
                                                        )}

                                                        {item.statusId === 'S3' && (
                                                            <div className="card-actions">
                                                                <a href={`/detail-doctor/${item.doctorId}`} className="btn-view-profile">
                                                                    Xem hồ sơ bác sĩ
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">
                                            <i className="fa-solid fa-calendar-xmark"></i>
                                        </div>
                                        <h3 className="empty-title">
                                            {activeTab === 'all' && 'Không có lịch hẹn nào'}
                                            {activeTab === 'upcoming' && 'Không có lịch hẹn sắp tới'}
                                            {activeTab === 'past' && 'Chưa có lịch sử khám bệnh'}
                                            {activeTab === 'cancelled' && 'Không có lịch hẹn đã hủy'}
                                        </h3>
                                        <p className="empty-description">
                                            {activeTab === 'upcoming' && 'Bạn chưa có lịch hẹn nào sắp tới.'}
                                            {activeTab === 'past' && 'Bạn chưa có lịch sử khám bệnh nào.'}
                                            {activeTab === 'cancelled' && 'Không có lịch hẹn nào đã bị hủy.'}
                                            {activeTab === 'all' && 'Không tìm thấy lịch hẹn nào.'}
                                        </p>
                                        <button
                                            className="btn-book-now"
                                            onClick={() => this.props.history.push('/booking-flow')}
                                        >
                                            Đặt lịch mới
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <HomeFooter />
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        userInfo: state.user.userInfo
    };
};

export default withRouter(connect(mapStateToProps)(BookingHistory));