import React, { Component } from 'react';
import { connect } from "react-redux";
import './ManageBooking.scss';
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import { getAllBookings, updateBookingStatus } from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import ViewHistoryModal from '../Doctor/ViewHistoryModal';
import ConfirmPaymentModal from './ConfirmPaymentModal';

class ManageBooking extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: '', // Default to empty to show all bookings
            bookings: [],
            filteredBookings: [],
            statusFilter: 'all', // all, pending, confirmed, cancelled, completed
            searchKeyword: '',
            isLoading: false,
            isOpenHistoryModal: false,
            selectedPatientId: null,
            selectedPatientName: '',
            isOpenConfirmModal: false,
            selectedBooking: null
        }
    }

    async componentDidMount() {
        this.loadBookings();
    }

    loadBookings = async () => {
        this.setState({ isLoading: true });
        try {
            let { currentDate } = this.state;
            let formattedDate = currentDate ? new Date(currentDate).getTime() : '';

            let res = await getAllBookings({
                date: formattedDate
            });

            if (res && res.errCode === 0) {
                this.setState({
                    bookings: res.data,
                    filteredBookings: res.data
                }, () => this.applyFilters()); // Apply any existing filters
            } else {
                toast.error('Không thể tải danh sách lịch đặt!');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Không thể tải danh sách lịch đặt!');
        }
        this.setState({ isLoading: false });
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {
            this.applyFilters();
        }
    }

    handleOnchangeDatePicker = (date) => {
        this.setState({
            currentDate: date[0]
        }, async () => {
            await this.loadBookings();
        });
    }

    handleClearDate = () => {
        this.setState({
            currentDate: ''
        }, async () => {
            await this.loadBookings();
        });
    }

    applyFilters = () => {
        let { bookings, statusFilter, searchKeyword } = this.state;
        let filtered = [...bookings];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(booking => booking.statusId === statusFilter);
        }

        // Filter by search keyword
        if (searchKeyword) {
            let keyword = searchKeyword.toLowerCase();
            filtered = filtered.filter(booking => {
                let patientName = `${booking.patientData?.firstName || ''} ${booking.patientData?.lastName || ''}`.toLowerCase();
                let doctorName = booking.doctorData ? `${booking.doctorData.lastName || ''} ${booking.doctorData.firstName || ''}`.toLowerCase() : '';
                let email = (booking.patientData?.email || '').toLowerCase();
                let phone = booking.patientData?.phonenumber || '';

                return patientName.includes(keyword) ||
                    doctorName.includes(keyword) ||
                    email.includes(keyword) ||
                    phone.includes(keyword);
            });
        }

        this.setState({ filteredBookings: filtered });
    }

    handleStatusFilterChange = (status) => {
        this.setState({ statusFilter: status }, () => {
            this.applyFilters();
        });
    }

    handleSearchChange = (event) => {
        this.setState({ searchKeyword: event.target.value }, () => {
            this.applyFilters();
        });
    }

    handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            let res = await updateBookingStatus({
                bookingId: bookingId,
                statusId: newStatus
            });

            if (res && res.errCode === 0) {
                toast.success('Cập nhật trạng thái lịch hẹn thành công!');
                await this.loadBookings();
            } else {
                toast.error('Cập nhật trạng thái lịch hẹn thất bại!');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Cập nhật trạng thái lịch hẹn thất bại!');
        }
    }

    getStatusBadge = (statusId) => {
        let { language } = this.props;
        let statusConfig = {
            'S1': { label: language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending', bg: '#fff3e0', color: '#e65100', border: '#ffe0b2', icon: 'fa-clock' },
            'S2': { label: language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed', bg: '#e3f2fd', color: '#0d47a1', border: '#bbdefb', icon: 'fa-check-circle' },
            'S3': { label: language === LANGUAGES.VI ? 'Hoàn thành' : 'Completed', bg: '#e8f5e9', color: '#1b5e20', border: '#c8e6c9', icon: 'fa-check-double' },
            'S4': { label: language === LANGUAGES.VI ? 'Đã hủy' : 'Cancelled', bg: '#ffebee', color: '#c62828', border: '#ffcdd2', icon: 'fa-times-circle' }
        };

        let config = statusConfig[statusId] || statusConfig['S1'];
        return (
            <span className="status-badge" style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`, padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <i className={`fa-solid ${config.icon}`}></i> {config.label}
            </span>
        );
    }

    handleOpenHistoryModal = (booking) => {
        this.setState({
            isOpenHistoryModal: true,
            selectedPatientId: booking.patientId,
            selectedPatientName: booking.patientData ? `${booking.patientData.firstName || ''} ${booking.patientData.lastName || ''}` : ''
        });
    }

    handleCloseHistoryModal = () => {
        this.setState({
            isOpenHistoryModal: false,
            selectedPatientId: null,
            selectedPatientName: ''
        });
    }

    handleOpenConfirmModal = (booking) => {
        this.setState({
            isOpenConfirmModal: true,
            selectedBooking: booking
        });
    }

    handleCloseConfirmModal = () => {
        this.setState({
            isOpenConfirmModal: false,
            selectedBooking: null
        });
    }

    handleConfirmPayment = async (bookingId, price, paymentMethod) => {
        try {
            this.setState({ isLoading: true });
            let res = await updateBookingStatus({
                bookingId: bookingId,
                statusId: 'S3',
                price: price,
                paymentMethod: paymentMethod
            });

            if (res && res.errCode === 0) {
                toast.success(this.props.language === LANGUAGES.VI ? 'Thanh toán và hoàn thành lịch hẹn thành công!' : 'Payment confirmed and appointment completed!');
                this.handleCloseConfirmModal();
                await this.loadBookings();
            } else {
                toast.error(this.props.language === LANGUAGES.VI ? 'Hoàn tất thanh toán thất bại!' : 'Failed to complete checkout!');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast.error(this.props.language === LANGUAGES.VI ? 'Lỗi hệ thống khi thanh toán!' : 'System error during checkout!');
        }
        this.setState({ isLoading: false });
    }

    getActionButtons = (booking) => {
        let { language } = this.props;

        if (booking.statusId === 'S1') {
            return (
                <div className="action-buttons">
                    <button
                        className="btn btn-confirm"
                        onClick={() => this.handleUpdateStatus(booking.id, 'S2')}
                    >
                        <i className="fa-solid fa-check"></i> {language === LANGUAGES.VI ? 'Xác nhận' : 'Confirm'}
                    </button>
                    <button
                        className="btn btn-cancel"
                        onClick={() => this.handleUpdateStatus(booking.id, 'S4')}
                    >
                        <i className="fa-solid fa-times"></i> {language === LANGUAGES.VI ? 'Hủy' : 'Cancel'}
                    </button>
                </div>
            );
        } else if (booking.statusId === 'S2') {
            return (
                <div className="action-buttons">
                    <button
                        className="btn btn-complete"
                        onClick={() => this.handleOpenConfirmModal(booking)}
                    >
                        <i className="fa-solid fa-check-double"></i> {language === LANGUAGES.VI ? 'Hoàn thành' : 'Complete'}
                    </button>
                </div>
            );
        } else if (booking.statusId === 'S3') {
            return (
                <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn"
                        onClick={() => this.handleOpenHistoryModal(booking)}
                        style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <i className="fa-solid fa-file-medical"></i> {language === LANGUAGES.VI ? 'Xem bệnh án' : 'View record'}
                    </button>
                    {booking.isPaid !== 1 && booking.isPaid !== '1' && (
                        <button
                            className="btn btn-complete"
                            onClick={() => this.handleOpenConfirmModal(booking)}
                            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e0a800', borderColor: '#d39e00' }}
                        >
                            <i className="fa-solid fa-file-invoice-dollar"></i> {language === LANGUAGES.VI ? 'Thanh toán' : 'Checkout'}
                        </button>
                    )}
                </div>
            );
        }
        return null;
    }

    render() {
        let { filteredBookings, isLoading, currentDate, statusFilter, searchKeyword } = this.state;
        let { language } = this.props;

        // Statistics
        let stats = {
            total: this.state.bookings.length,
            pending: this.state.bookings.filter(b => b.statusId === 'S1').length,
            confirmed: this.state.bookings.filter(b => b.statusId === 'S2').length,
            completed: this.state.bookings.filter(b => b.statusId === 'S3').length,
            cancelled: this.state.bookings.filter(b => b.statusId === 'S4').length
        };

        return (
            <div className="manage-booking-container">
                <div className="manage-booking-header">
                    <h2>
                        <i className="fa-solid fa-calendar-check"></i>
                        {language === LANGUAGES.VI ? 'Quản lý lịch hẹn khám bệnh' : 'Manage Appointments'}
                    </h2>
                </div>

                {/* Statistics Cards */}
                <div className="stats-cards">
                    <div className="stat-card stat-total">
                        <div className="stat-icon">
                            <i className="fa-solid fa-calendar-days"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Tổng cộng' : 'Total'}</div>
                        </div>
                    </div>
                    <div className="stat-card stat-pending">
                        <div className="stat-icon">
                            <i className="fa-solid fa-clock"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending'}</div>
                        </div>
                    </div>
                    <div className="stat-card stat-confirmed">
                        <div className="stat-icon">
                            <i className="fa-solid fa-check-circle"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.confirmed}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed'}</div>
                        </div>
                    </div>
                    <div className="stat-card stat-completed">
                        <div className="stat-icon">
                            <i className="fa-solid fa-check-double"></i>
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.completed}</div>
                            <div className="stat-label">{language === LANGUAGES.VI ? 'Hoàn thành' : 'Completed'}</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="booking-filters">
                    <div className="filter-group">
                        <label>{language === LANGUAGES.VI ? 'Chọn ngày' : 'Select Date'}</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <DatePicker
                                onChange={this.handleOnchangeDatePicker}
                                className="form-control"
                                value={currentDate}
                            />
                            {currentDate && (
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={this.handleClearDate} 
                                    title={language === LANGUAGES.VI ? 'Xóa bộ lọc ngày' : 'Clear date filter'}
                                    style={{ padding: '0 15px' }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="filter-group search-group">
                        <label>{language === LANGUAGES.VI ? 'Tìm kiếm' : 'Search'}</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={language === LANGUAGES.VI ? 'Tìm theo tên, email, SĐT...' : 'Search by name, email, phone...'}
                            value={searchKeyword}
                            onChange={this.handleSearchChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</label>
                        <div className="status-filter-buttons">
                            <button
                                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                onClick={() => this.handleStatusFilterChange('all')}
                            >
                                {language === LANGUAGES.VI ? 'Tất cả' : 'All'} ({stats.total})
                            </button>
                            <button
                                className={`filter-btn pending ${statusFilter === 'S1' ? 'active' : ''}`}
                                onClick={() => this.handleStatusFilterChange('S1')}
                            >
                                {language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending'} ({stats.pending})
                            </button>
                            <button
                                className={`filter-btn confirmed ${statusFilter === 'S2' ? 'active' : ''}`}
                                onClick={() => this.handleStatusFilterChange('S2')}
                            >
                                {language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed'} ({stats.confirmed})
                            </button>
                            <button
                                className={`filter-btn cancelled ${statusFilter === 'S4' ? 'active' : ''}`}
                                onClick={() => this.handleStatusFilterChange('S4')}
                            >
                                {language === LANGUAGES.VI ? 'Đã hủy' : 'Cancelled'} ({stats.cancelled})
                            </button>
                            <button
                                className={`filter-btn completed ${statusFilter === 'S3' ? 'active' : ''}`}
                                onClick={() => this.handleStatusFilterChange('S3')}
                            >
                                {language === LANGUAGES.VI ? 'Hoàn thành' : 'Completed'} ({stats.completed})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bookings-table-container">
                    <div className="table-header-bar">
                        <h3><i className="fas fa-calendar-check"></i> Danh Sách Lịch Hẹn</h3>
                        <span className="record-count">Tổng: {filteredBookings.length} lịch hẹn</span>
                    </div>

                    {isLoading ? (
                        <div className="loading">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>{language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}</span>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="no-data">
                            <i className="fa-solid fa-calendar-xmark"></i>
                            <p>{language === LANGUAGES.VI ? 'Không có lịch hẹn nào' : 'No bookings found'}</p>
                        </div>
                    ) : (
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Bệnh nhân' : 'Patient'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Liên hệ' : 'Contact'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Bác sĩ' : 'Doctor'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Thời gian' : 'Time'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Lý do khám' : 'Reason'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Giá khám' : 'Fee'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Thanh toán' : 'Payment'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</th>
                                    <th>{language === LANGUAGES.VI ? 'Thao tác' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking, index) => (
                                    <tr key={booking.id} className={`booking-row status-${booking.statusId}`}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="patient-info">
                                                <div className="patient-name">
                                                    {booking.patientData ? `${booking.patientData.firstName || ''} ${booking.patientData.lastName || ''}` : '—'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <div><i className="fa-solid fa-envelope"></i> {booking.patientData?.email || '—'}</div>
                                                <div><i className="fa-solid fa-phone"></i> {booking.patientData?.phonenumber || '—'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="doctor-info">
                                                {booking.doctorData ? (
                                                    language === LANGUAGES.VI
                                                        ? `${booking.doctorData.lastName} ${booking.doctorData.firstName}`
                                                        : `${booking.doctorData.firstName} ${booking.doctorData.lastName}`
                                                ) : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="time-info">
                                                <div><i className="fa-solid fa-calendar"></i> {booking.date ? moment(isNaN(booking.date) ? booking.date : +booking.date).format('DD/MM/YYYY') : '—'}</div>
                                                <div><i className="fa-solid fa-clock"></i> {language === LANGUAGES.VI ? booking.timeTypeDataPatient?.valueVi : booking.timeTypeDataPatient?.valueEn}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="reason-text">{booking.reason || '—'}</div>
                                        </td>
                                        <td>
                                            {/* Price / Fee */}
                                            {booking.doctorData?.Doctor_Infor?.priceTypeData ? (
                                                language === LANGUAGES.VI
                                                    ? (isNaN(booking.doctorData.Doctor_Infor.priceTypeData.valueVi) 
                                                        ? `${booking.doctorData.Doctor_Infor.priceTypeData.valueVi} VNĐ`
                                                        : `${Number(booking.doctorData.Doctor_Infor.priceTypeData.valueVi).toLocaleString('vi-VN')} VNĐ`)
                                                    : `${booking.doctorData.Doctor_Infor.priceTypeData.valueEn} USD`
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {/* Payment Method */}
                                            <div className="payment-cell">
                                                <div style={{ fontWeight: '500' }}>
                                                    {booking.doctorData?.Doctor_Infor?.paymentTypeData ? (
                                                        language === LANGUAGES.VI
                                                            ? booking.doctorData.Doctor_Infor.paymentTypeData.valueVi
                                                            : booking.doctorData.Doctor_Infor.paymentTypeData.valueEn
                                                    ) : '—'}
                                                </div>
                                                {(booking.isPaid === 1 || booking.isPaid === '1') ? (
                                                    <span className="badge-paid" style={{ backgroundColor: '#e2fbe8', color: '#1a7f37', border: '1px solid #acf2bd', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}>
                                                        <i className="fa-solid fa-circle-check"></i> {language === LANGUAGES.VI ? 'Đã thu tiền' : 'Paid'}
                                                    </span>
                                                ) : (
                                                    <span className="badge-unpaid" style={{ backgroundColor: '#fff8e6', color: '#b27b00', border: '1px solid #ffe8b3', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', display: 'inline-block', marginTop: '4px', fontWeight: 'bold' }}>
                                                        <i className="fa-solid fa-circle-info"></i> {language === LANGUAGES.VI ? 'Chưa thu tiền' : 'Unpaid'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {this.getStatusBadge(booking.statusId)}
                                        </td>
                                        <td>
                                            {this.getActionButtons(booking)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <ViewHistoryModal
                    isOpen={this.state.isOpenHistoryModal}
                    closeModal={this.handleCloseHistoryModal}
                    patientId={this.state.selectedPatientId}
                    patientName={this.state.selectedPatientName}
                />

                <ConfirmPaymentModal
                    isOpenModal={this.state.isOpenConfirmModal}
                    closeConfirmModal={this.handleCloseConfirmModal}
                    bookingData={this.state.selectedBooking}
                    handleConfirmPayment={this.handleConfirmPayment}
                />
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
        user: state.user.userInfo
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageBooking);
