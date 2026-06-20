import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LANGUAGES } from '../../../utils';
import { getAllBookings } from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import moment from 'moment';
import './RevenueReport.scss';

class RevenueReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startDate: moment().startOf('month').toDate(),
            endDate: moment().endOf('day').toDate(),
            bookings: [],
            isLoading: false,
            activeTab: 'doctors' // doctors, specialties
        }
    }

    async componentDidMount() {
        await this.loadAllBookings();
    }

    loadAllBookings = async () => {
        this.setState({ isLoading: true });
        try {
            // Fetch all bookings (empty date query gets all time records)
            let res = await getAllBookings({
                date: ''
            });

            if (res && res.errCode === 0) {
                this.setState({
                    bookings: res.data
                });
            } else {
                toast.error('Không thể tải dữ liệu lịch sử hóa đơn!');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Không thể kết nối đến máy chủ!');
        }
        this.setState({ isLoading: false });
    }

    handleStartDateChange = (date) => {
        this.setState({
            startDate: date[0]
        });
    }

    handleEndDateChange = (date) => {
        this.setState({
            endDate: date[0]
        });
    }

    handleQuickSelect = (type) => {
        let start, end;
        switch (type) {
            case 'today':
                start = moment().startOf('day').toDate();
                end = moment().endOf('day').toDate();
                break;
            case 'this-week':
                start = moment().startOf('week').toDate();
                end = moment().endOf('day').toDate();
                break;
            case 'this-month':
                start = moment().startOf('month').toDate();
                end = moment().endOf('day').toDate();
                break;
            case 'all-time':
                // Find oldest booking or default to beginning of year
                if (this.state.bookings.length > 0) {
                    let dates = this.state.bookings
                        .map(b => b.date ? Number(b.date) : null)
                        .filter(d => d !== null);
                    if (dates.length > 0) {
                        start = new Date(Math.min(...dates));
                    } else {
                        start = moment().subtract(1, 'year').startOf('year').toDate();
                    }
                } else {
                    start = moment().subtract(1, 'year').startOf('year').toDate();
                }
                end = moment().endOf('day').toDate();
                break;
            default:
                return;
        }
        this.setState({ startDate: start, endDate: end });
    }

    formatVND = (num) => {
        return Number(num || 0).toLocaleString('vi-VN') + ' đ';
    }

    render() {
        let { language } = this.props;
        let { bookings, startDate, endDate, isLoading, activeTab } = this.state;
        let isVi = language === LANGUAGES.VI;

        // Filter bookings in range
        let filtered = bookings.filter(b => {
            if (b.statusId === 'S4' || b.statusId === 'S1') return false; // exclude cancelled / pending confirm
            if (!b.date) return false;

            let bDate = moment(isNaN(b.date) ? b.date : +b.date).startOf('day');
            let start = moment(startDate).startOf('day');
            let end = moment(endDate).endOf('day');

            return bDate.isSameOrAfter(start) && bDate.isSameOrBefore(end);
        });

        // Compute overall statistics
        let paidBookings = filtered.filter(b => b.isPaid === 1);
        let totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
        let paidCount = paidBookings.length;
        let avgBillValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
        
        // Expected/Unpaid revenue from finished exams that haven't checkout yet
        let pendingBookings = filtered.filter(b => b.isPaid !== 1 && b.statusId === 'S3');
        let expectedPendingRevenue = pendingBookings.reduce((sum, b) => {
            let docFeeRaw = b.doctorData?.Doctor_Infor?.priceTypeData?.valueVi || '0';
            return sum + (isNaN(docFeeRaw) ? 0 : Number(docFeeRaw));
        }, 0);

        // Group by Doctor
        let doctorStats = {};
        filtered.forEach(b => {
            let doc = b.doctorData || {};
            let docId = doc.id;
            if (!docId) return;

            let name = `Bs. ${doc.lastName || ''} ${doc.firstName || ''}`;
            let spec = doc.Doctor_Infor?.specialtyData?.name || (isVi ? 'Phòng khám đa khoa' : 'General Practice');

            if (!doctorStats[docId]) {
                doctorStats[docId] = {
                    id: docId,
                    name: name,
                    specialty: spec,
                    patientCount: 0,
                    revenue: 0,
                    paidCount: 0,
                    unpaidCount: 0
                };
            }

            doctorStats[docId].patientCount += 1;
            if (b.isPaid === 1) {
                doctorStats[docId].revenue += Number(b.price || 0);
                doctorStats[docId].paidCount += 1;
            } else {
                doctorStats[docId].unpaidCount += 1;
            }
        });
        let doctorList = Object.values(doctorStats).sort((a, b) => b.revenue - a.revenue);

        // Group by Specialty
        let specialtyStats = {};
        filtered.forEach(b => {
            let doc = b.doctorData || {};
            let specName = doc.Doctor_Infor?.specialtyData?.name || (isVi ? 'Chuyên khoa khác' : 'Other Specialty');

            if (!specialtyStats[specName]) {
                specialtyStats[specName] = {
                    name: specName,
                    patientCount: 0,
                    revenue: 0,
                    paidCount: 0
                };
            }

            specialtyStats[specName].patientCount += 1;
            if (b.isPaid === 1) {
                specialtyStats[specName].revenue += Number(b.price || 0);
                specialtyStats[specName].paidCount += 1;
            }
        });
        let specialtyList = Object.values(specialtyStats).sort((a, b) => b.revenue - a.revenue);

        return (
            <div className="revenue-report-container container-fluid">
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        {/* Title Row */}
                        <div className="row align-items-center mb-4">
                            <div className="col-md-6">
                                <h4 className="text-admin font-weight-bold mb-0">
                                    <i className="fas fa-chart-line me-2"></i>
                                    {isVi ? 'Báo Cáo Thống Kê Doanh Thu' : 'Revenue & Statistics Report'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {isVi ? 'Theo dõi doanh thu phòng khám, doanh thu bác sĩ và chuyên khoa' : 'Track clinic income, doctor performance, and specialty billing'}
                                </p>
                            </div>
                        </div>

                        {/* Date Range Selection & Quick Select Filters */}
                        <div className="row g-3 align-items-end mb-4 border-top pt-4">
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label fw-bold small text-secondary mb-2">{isVi ? 'Từ ngày' : 'Start Date'}</label>
                                <DatePicker
                                    onChange={this.handleStartDateChange}
                                    className="form-control"
                                    value={startDate}
                                />
                            </div>
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label fw-bold small text-secondary mb-2">{isVi ? 'Đến ngày' : 'End Date'}</label>
                                <DatePicker
                                    onChange={this.handleEndDateChange}
                                    className="form-control"
                                    value={endDate}
                                />
                            </div>
                            <div className="col-md-6 col-12 d-flex flex-wrap gap-2 justify-content-md-end align-items-center mt-3 mt-md-0">
                                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => this.handleQuickSelect('today')}>
                                    {isVi ? 'Hôm nay' : 'Today'}
                                </button>
                                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => this.handleQuickSelect('this-week')}>
                                    {isVi ? 'Tuần này' : 'This Week'}
                                </button>
                                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => this.handleQuickSelect('this-month')}>
                                    {isVi ? 'Tháng này' : 'This Month'}
                                </button>
                                <button className="btn btn-sm btn-purple rounded-pill px-3" onClick={() => this.handleQuickSelect('all-time')}>
                                    {isVi ? 'Tất cả thời gian' : 'All-time'}
                                </button>
                                <button className="btn btn-sm btn-outline-admin rounded-pill px-3" onClick={this.loadAllBookings} disabled={isLoading}>
                                    <i className="fas fa-sync-alt me-1"></i> {isVi ? 'Làm mới' : 'Refresh'}
                                </button>
                            </div>
                        </div>

                        {/* Revenue Cards */}
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-3">
                                <div className="stat-card p-3 border rounded-3 d-flex align-items-center gap-3 shadow-sm" style={{ backgroundColor: 'rgba(40, 167, 69, 0.08)', borderColor: 'rgba(40, 167, 69, 0.2)' }}>
                                    <div className="stat-icon bg-success text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-wallet"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-success fs-5">{this.formatVND(totalRevenue)}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{isVi ? 'TỔNG DOANH THU THỰC TẾ' : 'TOTAL ACTUAL REVENUE'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3 shadow-sm">
                                    <div className="stat-icon bg-primary-light text-primary rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-file-invoice-dollar"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-5">{paidCount}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{isVi ? 'HÓA ĐƠN ĐÃ THU PHÍ' : 'PAID INVOICES'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3 shadow-sm">
                                    <div className="stat-icon bg-info-light text-info rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-calculator"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark fs-5">{this.formatVND(avgBillValue)}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{isVi ? 'TRUNG BÌNH HÓA ĐƠN' : 'AVERAGE BILL VALUE'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="stat-card p-3 border rounded-3 d-flex align-items-center gap-3 shadow-sm" style={{ backgroundColor: 'rgba(255, 193, 7, 0.08)', borderColor: 'rgba(255, 193, 7, 0.2)' }}>
                                    <div className="stat-icon bg-warning text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                        <i className="fa-solid fa-clock"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold text-warning fs-5">{this.formatVND(expectedPendingRevenue)}</div>
                                        <div className="text-secondary small" style={{ fontSize: '11px' }}>{isVi ? 'DOANH THU CHỜ THU HỘ' : 'PENDING CHECKOUT REVENUE'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <ul className="nav nav-tabs border-bottom mb-4">
                            <li className="nav-item">
                                <button
                                    className={`nav-link border-0 fw-bold ${activeTab === 'doctors' ? 'active text-admin border-bottom border-3 border-admin bg-transparent' : 'text-secondary bg-transparent'}`}
                                    onClick={() => this.setState({ activeTab: 'doctors' })}
                                    style={{ fontSize: '14px', paddingBottom: '10px' }}
                                >
                                    <i className="fas fa-user-md me-2"></i>
                                    {isVi ? 'Doanh Thu Theo Bác Sĩ' : 'Revenue by Doctor'}
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link border-0 fw-bold ${activeTab === 'specialties' ? 'active text-admin border-bottom border-3 border-admin bg-transparent' : 'text-secondary bg-transparent'}`}
                                    onClick={() => this.setState({ activeTab: 'specialties' })}
                                    style={{ fontSize: '14px', paddingBottom: '10px' }}
                                >
                                    <i className="fas fa-stethoscope me-2"></i>
                                    {isVi ? 'Doanh Thu Theo Chuyên Khoa' : 'Revenue by Specialty'}
                                </button>
                            </li>
                        </ul>

                        {/* Content tables */}
                        {isLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : activeTab === 'doctors' ? (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th style={{ width: '60px' }}>#</th>
                                            <th>{isVi ? 'Bác sĩ' : 'Doctor'}</th>
                                            <th>{isVi ? 'Chuyên khoa' : 'Specialty'}</th>
                                            <th className="text-center">{isVi ? 'Số ca phục vụ' : 'Total Patients'}</th>
                                            <th className="text-center">{isVi ? 'Số ca đã thu phí' : 'Paid Cases'}</th>
                                            <th className="text-end">{isVi ? 'Doanh thu đem lại' : 'Total Revenue Generated'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctorList && doctorList.length > 0 ? (
                                            doctorList.map((doc, idx) => (
                                                <tr key={doc.id}>
                                                    <td>{idx + 1}</td>
                                                    <td className="fw-bold text-dark">{doc.name}</td>
                                                    <td className="text-secondary">{doc.specialty}</td>
                                                    <td className="text-center fw-bold">{doc.patientCount}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success-light text-success px-2 py-1">
                                                            {doc.paidCount} / {doc.patientCount}
                                                        </span>
                                                    </td>
                                                    <td className="text-end fw-bold text-success fs-6">{this.formatVND(doc.revenue)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    {isVi ? 'Không có dữ liệu trong khoảng thời gian này' : 'No data in this period'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th style={{ width: '60px' }}>#</th>
                                            <th>{isVi ? 'Tên Chuyên Khoa' : 'Specialty Name'}</th>
                                            <th className="text-center">{isVi ? 'Số ca phục vụ' : 'Total Patients'}</th>
                                            <th className="text-center">{isVi ? 'Hóa đơn đã thu' : 'Paid Bills'}</th>
                                            <th className="text-end">{isVi ? 'Doanh thu đem lại' : 'Total Revenue Generated'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {specialtyList && specialtyList.length > 0 ? (
                                            specialtyList.map((spec, idx) => (
                                                <tr key={idx}>
                                                    <td>{idx + 1}</td>
                                                    <td className="fw-bold text-dark">{spec.name}</td>
                                                    <td className="text-center fw-bold">{spec.patientCount}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success-light text-success px-2 py-1">
                                                            {spec.paidCount}
                                                        </span>
                                                    </td>
                                                    <td className="text-end fw-bold text-success fs-6">{this.formatVND(spec.revenue)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 text-muted">
                                                    {isVi ? 'Không có dữ liệu trong khoảng thời gian này' : 'No data in this period'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language
    };
};

const mapDispatchToProps = dispatch => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(RevenueReport);
