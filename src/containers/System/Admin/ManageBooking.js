import React, { Component } from 'react';
import { connect } from "react-redux";
import './ManageBooking.scss';
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import { getAllBookings, updateBookingStatus } from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import ViewHistoryModal from '../Doctor/ViewHistoryModal';
import PatientInfoModal from '../Doctor/PatientInfoModal';

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
            isOpenPatientInfoModal: false,
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

    handleBtnViewInfo = (booking) => {
        this.setState({
            isOpenPatientInfoModal: true,
            selectedBooking: booking
        });
    }

    closePatientInfoModal = () => {
        this.setState({
            isOpenPatientInfoModal: false,
            selectedBooking: null
        });
    }

    getActionButtons = (booking) => {
        let { language } = this.props;

        return (
            <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button
                    className="btn btn-sm btn-outline-info rounded-pill px-3"
                    onClick={() => this.handleBtnViewInfo(booking)}
                >
                    <i className="fas fa-id-card"></i> {language === LANGUAGES.VI ? 'Chi tiết' : 'Details'}
                </button>

                {booking.statusId === 'S1' && (
                    <button
                        className="btn btn-sm btn-outline-admin rounded-pill px-3"
                        onClick={() => this.handleUpdateStatus(booking.id, 'S2')}
                    >
                        <i className="fa-solid fa-check"></i> {language === LANGUAGES.VI ? 'Xác nhận' : 'Confirm'}
                    </button>
                )}

                {(booking.statusId === 'S1' || booking.statusId === 'S2') && (
                    <button
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        onClick={() => this.handleUpdateStatus(booking.id, 'S4')}
                    >
                        <i className="fa-solid fa-times"></i> {language === LANGUAGES.VI ? 'Hủy' : 'Cancel'}
                    </button>
                )}

                {booking.statusId === 'S3' && (
                    <button
                        className="btn btn-sm btn-outline-success rounded-pill px-3"
                        onClick={() => this.handleOpenHistoryModal(booking)}
                    >
                        <i className="fa-solid fa-file-medical"></i> {language === LANGUAGES.VI ? 'Xem bệnh án' : 'View record'}
                    </button>
                )}
            </div>
        );
    }

    formatVND = (num) => {
        return Number(num || 0).toLocaleString('vi-VN') + ' đ';
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
            cancelled: this.state.bookings.filter(b => b.statusId === 'S4').length,
            revenue: this.state.bookings.reduce((sum, b) => b.isPaid === 1 ? sum + Number(b.price || 0) : sum, 0)
        };

        return (
            <div className="manage-booking-container container-fluid">
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Header */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fa-solid fa-calendar-check me-2"></i>
                                    {language === LANGUAGES.VI ? 'Quản lý lịch hẹn khám bệnh' : 'Manage Appointments'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {language === LANGUAGES.VI ? 'Xem thống kê, lọc và xử lý danh sách lịch hẹn khám bệnh' : 'View statistics, filter and process patient appointments'}
                                </p>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-admin-light text-admin rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-calendar-days"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.total}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Tổng cộng' : 'Total'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-warning-light text-warning rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-clock"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.pending}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-primary-light text-primary rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-check-circle"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.confirmed}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                    <div className="stat-icon bg-success-light text-success rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-check-double"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-6">{stats.completed}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Hoàn thành' : 'Completed'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md">
                                <div className="stat-card p-3 border rounded-3 d-flex align-items-center gap-3" style={{ backgroundColor: 'rgba(40, 167, 69, 0.08)', borderColor: 'rgba(40, 167, 69, 0.2)' }}>
                                    <div className="stat-icon bg-success text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-wallet"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-success fs-6">{this.formatVND(stats.revenue)}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Doanh thu' : 'Revenue'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="row g-3 align-items-end mb-4 border-top pt-4">
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Chọn ngày' : 'Select Date'}</label>
                                <div className="d-flex gap-2">
                                    <DatePicker
                                        onChange={this.handleOnchangeDatePicker}
                                        className="form-control"
                                        value={currentDate}
                                    />
                                    {currentDate && (
                                        <button 
                                            className="btn btn-outline-secondary" 
                                            onClick={this.handleClearDate} 
                                            title={language === LANGUAGES.VI ? 'Xóa bộ lọc ngày' : 'Clear date filter'}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6">
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Tìm kiếm' : 'Search'}</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder={language === LANGUAGES.VI ? 'Tìm theo tên, email, SĐT...' : 'Search by name, email, phone...'}
                                        value={searchKeyword}
                                        onChange={this.handleSearchChange}
                                    />
                                </div>
                            </div>
                            <div className="col-md-5 col-12">
                                <label className="form-label fw-bold small text-secondary mb-2">{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</label>
                                <div className="d-flex flex-wrap gap-2">
                                    <button
                                        className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'all' ? 'btn-admin' : 'btn-outline-admin'}`}
                                        onClick={() => this.handleStatusFilterChange('all')}
                                    >
                                        {language === LANGUAGES.VI ? 'Tất cả' : 'All'} ({stats.total})
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S1' ? 'btn-admin' : 'btn-outline-admin'}`}
                                        onClick={() => this.handleStatusFilterChange('S1')}
                                    >
                                        {language === LANGUAGES.VI ? 'Chờ' : 'Pending'} ({stats.pending})
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S2' ? 'btn-admin' : 'btn-outline-admin'}`}
                                        onClick={() => this.handleStatusFilterChange('S2')}
                                    >
                                        {language === LANGUAGES.VI ? 'Xác nhận' : 'Confirmed'} ({stats.confirmed})
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S4' ? 'btn-admin' : 'btn-outline-admin'}`}
                                        onClick={() => this.handleStatusFilterChange('S4')}
                                    >
                                        {language === LANGUAGES.VI ? 'Hủy' : 'Cancelled'} ({stats.cancelled})
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S3' ? 'btn-admin' : 'btn-outline-admin'}`}
                                        onClick={() => this.handleStatusFilterChange('S3')}
                                    >
                                        {language === LANGUAGES.VI ? 'Xong' : 'Done'} ({stats.completed})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-responsive mt-3">
                            <table className="table table-hover align-middle">
                                <thead className="table-light text-secondary">
                                    <tr>
                                        <th style={{ width: '60px' }}>#</th>
                                        <th>{language === LANGUAGES.VI ? 'Bệnh nhân' : 'Patient'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Bác sĩ' : 'Doctor'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Thời gian' : 'Time'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Lý do khám' : 'Reason'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</th>
                                        <th className="text-center" style={{ width: '220px' }}>{language === LANGUAGES.VI ? 'Thao tác' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                                {language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}
                                            </td>
                                        </tr>
                                    ) : filteredBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">
                                                {language === LANGUAGES.VI ? 'Không có lịch hẹn nào' : 'No bookings found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBookings.map((booking, index) => (
                                            <tr key={booking.id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="fw-bold text-dark">
                                                        {booking.patientData ? `${booking.patientData.lastName || ''} ${booking.patientData.firstName || ''}` : '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-primary">
                                                        Bs. {booking.doctorData ? `${booking.doctorData.lastName} ${booking.doctorData.firstName}` : ''}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div><i className="fa-solid fa-calendar text-muted small me-1"></i> {booking.date ? moment(isNaN(booking.date) ? booking.date : +booking.date).format('DD/MM/YYYY') : '—'}</div>
                                                    <div className="text-secondary small"><i className="fa-solid fa-clock me-1"></i> {language === LANGUAGES.VI ? booking.timeTypeDataPatient?.valueVi : booking.timeTypeDataPatient?.valueEn}</div>
                                                </td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '180px' }} title={booking.reason}>
                                                        {booking.reason || '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    {this.getStatusBadge(booking.statusId)}
                                                </td>
                                                <td className="text-center">
                                                    {this.getActionButtons(booking)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <ViewHistoryModal
                    isOpen={this.state.isOpenHistoryModal}
                    closeModal={this.handleCloseHistoryModal}
                    patientId={this.state.selectedPatientId}
                    patientName={this.state.selectedPatientName}
                />

                <PatientInfoModal
                    isOpenModal={this.state.isOpenPatientInfoModal}
                    closePatientInfoModal={this.closePatientInfoModal}
                    dataModal={this.state.selectedBooking}
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
