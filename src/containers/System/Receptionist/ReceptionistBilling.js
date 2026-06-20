import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LANGUAGES } from '../../../utils';
import { getAllBookings, updateBookingStatus } from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import ConfirmPaymentModal from '../Admin/ConfirmPaymentModal';

class ReceptionistBilling extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: new Date(),
            bookings: [],
            paymentFilter: 'all', // all, paid, unpaid
            searchKeyword: '',
            isLoading: false,

            // Payment modal state
            isOpenConfirmModal: false,
            selectedBooking: null
        }
    }

    async componentDidMount() {
        await this.loadBookings();
    }

    loadBookings = async () => {
        this.setState({ isLoading: true });
        try {
            let { currentDate } = this.state;
            let formattedDate = currentDate ? new Date(currentDate).setHours(0,0,0,0) : '';

            let res = await getAllBookings({
                date: formattedDate
            });

            if (res && res.errCode === 0) {
                // Keep bookings that are S2 (Checked-in) or S3 (Exam completed) or already paid
                let activeBookings = res.data.filter(b => b.statusId !== 'S4' && b.statusId !== 'S1');
                this.setState({
                    bookings: activeBookings
                });
            } else {
                toast.error('Không thể tải danh sách thanh toán!');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Không thể tải danh sách thanh toán!');
        }
        this.setState({ isLoading: false });
    }

    handleOnchangeDatePicker = (date) => {
        this.setState({
            currentDate: date[0]
        }, async () => {
            await this.loadBookings();
        });
    }

    handleSearchChange = (event) => {
        this.setState({ searchKeyword: event.target.value });
    }

    handleFilterChange = (filter) => {
        this.setState({ paymentFilter: filter });
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

    handleConfirmPayment = async (bookingId, price, paymentMethod, servicePrices, medicinePrices) => {
        try {
            let res = await updateBookingStatus({
                bookingId: bookingId,
                statusId: 'S3', // mark as completed / checkout finished
                price: price,
                paymentMethod: paymentMethod,
                servicePrices: servicePrices,
                medicinePrices: medicinePrices
            });

            if (res && res.errCode === 0) {
                toast.success(this.props.language === LANGUAGES.VI ? 'Hoàn tất thanh toán thành công!' : 'Payment completed successfully!');
                await this.loadBookings();
            } else {
                toast.error(res.errMessage || 'Lỗi thanh toán');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            toast.error('Lỗi máy chủ');
        }
    }

    formatVND = (num) => {
        return Number(num || 0).toLocaleString('vi-VN') + ' đ';
    }

    render() {
        let { language } = this.props;
        let { bookings, paymentFilter, searchKeyword, currentDate, isOpenConfirmModal, selectedBooking, isLoading } = this.state;
        let isVi = language === LANGUAGES.VI;

        // Apply filters
        let filtered = bookings.filter(b => {
            // Payment filter
            if (paymentFilter === 'paid' && b.isPaid !== 1) return false;
            if (paymentFilter === 'unpaid' && b.isPaid === 1) return false;

            // Search filter
            let kw = searchKeyword.toLowerCase().trim();
            if (!kw) return true;
            let patient = b.patientData || {};
            let name = `${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
            let phone = (patient.phonenumber || '').toLowerCase();
            let token = (b.token || '').toLowerCase();

            return name.includes(kw) || phone.includes(kw) || token.includes(kw);
        });

        // Calculate statistics
        let totalRevenue = bookings.reduce((sum, b) => b.isPaid === 1 ? sum + Number(b.price || 0) : sum, 0);
        let paidCount = bookings.filter(b => b.isPaid === 1).length;
        let unpaidCount = bookings.filter(b => b.isPaid !== 1 && b.statusId === 'S3').length;
        let examiningCount = bookings.filter(b => b.statusId === 'S2').length;

        return (
            <div className="receptionist-billing-container container-fluid">
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                                <h4 className="text-primary font-weight-bold mb-0">
                                    <i className="fas fa-file-invoice-dollar me-2"></i>
                                    {isVi ? 'Quầy Thu Ngân & Thanh Toán' : 'Billing & Cashier Desk'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {isVi ? 'Thu phí dịch vụ, xác nhận thanh toán và in biên lai hóa đơn' : 'Collect service fees, confirm payment, and print receipts'}
                                </p>
                            </div>
                            <div className="col-md-7 d-flex flex-wrap justify-content-md-end gap-3 mt-3 mt-md-0">
                                {/* Filter Pills */}
                                <div className="btn-group border rounded-pill p-1 bg-light">
                                    <button 
                                        className={`btn btn-sm rounded-pill px-3 ${paymentFilter === 'all' ? 'btn-purple' : 'btn-light text-secondary'}`}
                                        onClick={() => this.handleFilterChange('all')}
                                    >
                                        {isVi ? 'Tất cả' : 'All'}
                                    </button>
                                    <button 
                                        className={`btn btn-sm rounded-pill px-3 ${paymentFilter === 'unpaid' ? 'btn-purple' : 'btn-light text-secondary'}`}
                                        onClick={() => this.handleFilterChange('unpaid')}
                                    >
                                        {isVi ? 'Chưa thu' : 'Unpaid'}
                                    </button>
                                    <button 
                                        className={`btn btn-sm rounded-pill px-3 ${paymentFilter === 'paid' ? 'btn-purple' : 'btn-light text-secondary'}`}
                                        onClick={() => this.handleFilterChange('paid')}
                                    >
                                        {isVi ? 'Đã thu' : 'Paid'}
                                    </button>
                                </div>

                                <div style={{ width: '180px' }}>
                                    <DatePicker
                                        onChange={this.handleOnchangeDatePicker}
                                        className="form-control"
                                        value={currentDate}
                                    />
                                </div>
                                <div style={{ width: '220px' }}>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            placeholder={isVi ? 'Tên, SĐT bệnh nhân...' : 'Search patient...'}
                                            value={searchKeyword}
                                            onChange={this.handleSearchChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Statistics Cards */}
                        <div className="row g-3 mb-4 mt-2">
                            <div className="col-12 col-md-3">
                                <div className="card shadow-sm h-100 border-0 border-start border-4 border-success" style={{ backgroundColor: 'rgba(40, 167, 69, 0.08)' }}>
                                    <div className="card-body py-3 d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted small fw-bold text-uppercase">{isVi ? 'Doanh Thu Trong Ngày' : 'Daily Revenue'}</div>
                                            <h4 className="mb-0 text-success fw-bold mt-1" style={{ letterSpacing: '0.5px' }}>{this.formatVND(totalRevenue)}</h4>
                                        </div>
                                        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                            <i className="fas fa-wallet"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card shadow-sm h-100 border-0 border-start border-4 border-primary" style={{ backgroundColor: 'rgba(0, 123, 255, 0.08)' }}>
                                    <div className="card-body py-3 d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted small fw-bold text-uppercase">{isVi ? 'Đã Thanh Toán' : 'Paid Invoices'}</div>
                                            <h4 className="mb-0 text-primary fw-bold mt-1">{paidCount} <span className="small text-muted" style={{ fontSize: '12px' }}>{isVi ? 'HĐ' : 'bills'}</span></h4>
                                        </div>
                                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                            <i className="fas fa-check-circle"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="card shadow-sm h-100 border-0 border-start border-4 border-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.08)' }}>
                                    <div className="card-body py-3 d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted small fw-bold text-uppercase">{isVi ? 'Chờ Thanh Toán' : 'Pending'}</div>
                                            <h4 className="mb-0 text-warning fw-bold mt-1">{unpaidCount} <span className="small text-muted" style={{ fontSize: '12px' }}>{isVi ? 'HĐ' : 'bills'}</span></h4>
                                        </div>
                                        <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                            <i className="fas fa-spinner fa-spin"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="card shadow-sm h-100 border-0 border-start border-4 border-info" style={{ backgroundColor: 'rgba(23, 162, 184, 0.08)' }}>
                                    <div className="card-body py-3 d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted small fw-bold text-uppercase">{isVi ? 'Đang Khám Bệnh' : 'In Exam'}</div>
                                            <h4 className="mb-0 text-info fw-bold mt-1">{examiningCount} <span className="small text-muted" style={{ fontSize: '12px' }}>{isVi ? 'người' : 'patients'}</span></h4>
                                        </div>
                                        <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                            <i className="fas fa-user-md"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive mt-4">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th>#</th>
                                            <th>{isVi ? 'Mã HD' : 'Invoice ID'}</th>
                                            <th>{isVi ? 'Bệnh nhân' : 'Patient'}</th>
                                            <th>{isVi ? 'Bác sĩ chỉ định' : 'Doctor'}</th>
                                            <th>{isVi ? 'Phí khám gốc' : 'Base Fee'}</th>
                                            <th>{isVi ? 'Tổng tiền thu' : 'Total Amount'}</th>
                                            <th>{isVi ? 'Thanh toán' : 'Payment'}</th>
                                            <th className="text-center">{isVi ? 'Thao tác' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered && filtered.length > 0 ? (
                                            filtered.map((b, idx) => {
                                                let p = b.patientData || {};
                                                let d = b.doctorData || {};
                                                let examFeeRaw = d.Doctor_Infor?.priceTypeData?.valueVi || '0';
                                                let examFee = isNaN(examFeeRaw) ? 0 : Number(examFeeRaw);
                                                
                                                return (
                                                    <tr key={b.id}>
                                                        <td>{idx + 1}</td>
                                                        <td className="text-monospace text-danger fw-bold" style={{ fontSize: '13px' }}>
                                                            {b.token ? b.token.substring(0, 8).toUpperCase() : '—'}
                                                        </td>
                                                        <td>
                                                            <div className="fw-bold text-dark">{p.lastName} {p.firstName}</div>
                                                            <div className="text-muted small">{p.phonenumber}</div>
                                                        </td>
                                                        <td>
                                                            <div className="fw-bold">Bs. {d.lastName} {d.firstName}</div>
                                                            <div className="small text-muted">{b.timeTypeDataPatient ? (isVi ? b.timeTypeDataPatient.valueVi : b.timeTypeDataPatient.valueEn) : ''}</div>
                                                        </td>
                                                        <td className="fw-bold text-secondary">{this.formatVND(examFee)}</td>
                                                        <td className="fw-bold text-success" style={{ fontSize: '15px' }}>
                                                            {b.isPaid === 1 ? this.formatVND(b.price) : (isVi ? 'Chờ tạm tính' : 'Pending')}
                                                        </td>
                                                        <td>
                                                            {b.isPaid === 1 ? (
                                                                <span className="badge bg-success-light text-success border border-success-subtle p-2">
                                                                    <i className="fas fa-check-circle me-1"></i> {isVi ? 'Đã thanh toán' : 'Paid'}
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-danger-light text-danger border border-danger-subtle p-2">
                                                                    <i className="fas fa-exclamation-circle me-1"></i> {isVi ? 'Chưa thanh toán' : 'Unpaid'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            {b.isPaid === 1 ? (
                                                                <button 
                                                                    className="btn btn-sm btn-outline-info rounded-pill px-3 me-2"
                                                                    onClick={() => this.handleOpenConfirmModal(b)}
                                                                >
                                                                    <i className="fas fa-print me-1"></i> {isVi ? 'In hóa đơn' : 'Invoice'}
                                                                </button>
                                                            ) : (
                                                                b.statusId === 'S3' ? (
                                                                    <button 
                                                                        className="btn btn-sm btn-purple rounded-pill px-3"
                                                                        onClick={() => this.handleOpenConfirmModal(b)}
                                                                    >
                                                                        <i className="fas fa-cash-register me-1"></i> {isVi ? 'Thu tiền' : 'Collect Fee'}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-muted small">
                                                                        <i className="fas fa-spinner fa-spin me-1"></i> {isVi ? 'Đang khám...' : 'In Exam...'}
                                                                    </span>
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4 text-muted">
                                                    {isVi ? 'Không tìm thấy hóa đơn nào' : 'No bills found'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reusing Admin ConfirmPaymentModal */}
                {isOpenConfirmModal && selectedBooking && (
                    <ConfirmPaymentModal
                        isOpenModal={isOpenConfirmModal}
                        closeConfirmModal={this.handleCloseConfirmModal}
                        bookingData={selectedBooking}
                        handleConfirmPayment={this.handleConfirmPayment}
                    />
                )}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language,
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(ReceptionistBilling);
