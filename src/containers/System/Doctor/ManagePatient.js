import React, { Component } from 'react';
import { connect } from "react-redux";
import './ManagePatient.scss';
import DatePicker from '../../../components/Input/DatePicker';
import { getAllPatientForDoctor, postSendRemedy, postCancelBooking } from '../../../services/userService';
import moment from 'moment';
import { LANGUAGES } from '../../../utils';
import MedicalRecordModal from './MedicalRecordModal';
import CancelBookingModal from './CancelBookingModal';
import PatientInfoModal from './PatientInfoModal';
import { toast } from 'react-toastify';

class ManagePatient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: moment(new Date()).startOf('day').valueOf(),
            dataPatient: [],
            filteredPatients: [],
            statusFilter: 'all', // all, pending, confirmed, cancelled, completed
            searchKeyword: '',
            isLoading: false,
            isOpenRemedyModal: false,
            isOpenCancelModal: false,
            isOpenPatientInfoModal: false,
            dataModal: {},
            patientInfoData: {}
        }
    }

    async componentDidMount() {
        this.getDataPatient()
    }

    getDataPatient = async () => {
        let { user } = this.props;
        if (!user || !user.id) {
            return;
        }
        this.setState({ isLoading: true });
        try {
            let { currentDate } = this.state;
            let formattedDate = currentDate ? new Date(currentDate).getTime() : '';

            let res = await getAllPatientForDoctor({
                doctorId: user.id,
                date: formattedDate
            })

            if (res && res.errCode === 0) {
                this.setState({
                    dataPatient: res.data,
                    filteredPatients: res.data
                }, () => this.applyFilters())
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            toast.error('Không thể tải danh sách bệnh nhân');
        }
        this.setState({ isLoading: false });
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {
            this.applyFilters();
        }
        if (prevProps.user !== this.props.user) {
            this.getDataPatient();
        }
    }

    handleOnchangeDatePicker = (date) => {
        this.setState({
            currentDate: date[0]
        }, async () => {
            await this.getDataPatient()
        })
    }

    handleClearDate = () => {
        this.setState({
            currentDate: ''
        }, async () => {
            await this.getDataPatient();
        });
    }

    applyFilters = () => {
        let { dataPatient, statusFilter, searchKeyword } = this.state;
        let filtered = [...dataPatient];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(patient => patient.statusId === statusFilter);
        }

        // Filter by search keyword
        if (searchKeyword) {
            let keyword = searchKeyword.toLowerCase();
            filtered = filtered.filter(patient => {
                let patientName = `${patient.patientData?.firstName || ''} ${patient.patientData?.lastName || ''}`.toLowerCase();
                let email = (patient.patientData?.email || '').toLowerCase();
                let phone = (patient.patientData?.phonenumber || '').toLowerCase();

                return patientName.includes(keyword) ||
                    email.includes(keyword) ||
                    phone.includes(keyword);
            });
        }

        // Sort: checked-in patients first (by check-in time), then non-checked-in patients (by booking order)
        filtered.sort((x, y) => {
            let xVitals = x.weight && x.height && x.bloodPressure && x.temperature;
            let yVitals = y.weight && y.height && y.bloodPressure && y.temperature;

            // 1. Prioritize patients with recorded vitals (already checked in at the desk)
            if (xVitals && !yVitals) return -1;
            if (!xVitals && yVitals) return 1;

            // 2. If both have recorded vitals, sort by check-in time (updatedAt ASC - who checked in first gets examined first)
            if (xVitals && yVitals) {
                return new Date(x.updatedAt) - new Date(y.updatedAt);
            }

            // 3. If both have not checked in yet, sort by scheduled slot & booking order (queueNumber ASC)
            return (x.queueNumber || 0) - (y.queueNumber || 0);
        });

        this.setState({ filteredPatients: filtered });
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

    handleBtnConfirm = (item, isReadOnly = false) => {
        let data = {
            doctorId: item.doctorId,
            patientId: item.patientId,
            email: item.patientData ? item.patientData.email : '',
            timeType: item.timeType,
            date: item.date,
            patientName: item.patientData ? item.patientData.firstName : '',
            reason: item.reason || '',
            isReadOnly: isReadOnly
        }
        this.setState({
            isOpenRemedyModal: true,
            dataModal: data,
        })
    }

    handleBtnViewInfo = (item) => {
        this.setState({
            isOpenPatientInfoModal: true,
            patientInfoData: item || {}
        });
    }

    closePatientInfoModal = () => {
        this.setState({
            isOpenPatientInfoModal: false,
            patientInfoData: {}
        });
    }

    closeRemedyModal = () => {
        this.setState({
            isOpenRemedyModal: false,
            dataModal: {}
        })
    }

    sendRemedy = async (dataChild) => {
        let { dataModal } = this.state
        let res = await postSendRemedy({
            email: dataChild.email,
            imgBase64: dataChild.imgBase64,
            followUpDate: dataChild.followUpDate,
            diagnosis: dataChild.diagnosis,
            prescription: dataChild.prescription,
            services: dataChild.services,
            doctorId: dataModal.doctorId,
            patientId: dataModal.patientId,
            timeType: dataModal.timeType,
            date: dataModal.date,
            language: this.props.language,
            patientName: dataModal.patientName,
            paymentMethod: dataChild.paymentMethod
        })
        if (res && res.errCode === 0) {
            toast.success(this.props.language === LANGUAGES.VI ? 'Gửi hóa đơn và bệnh án thành công!' : 'Remedy and medical record sent successfully!');
            this.closeRemedyModal();
            await this.getDataPatient();
            return true;
        }
        else {
            toast.error(this.props.language === LANGUAGES.VI ? 'Gửi hóa đơn và bệnh án thất bại!' : 'Failed to send remedy and medical record!');
            return false;
        }
    }

    handleBtnCancel = (item) => {
        let date = item.date;
        this.setState({
            isOpenCancelModal: true,
            dataModal: {
                doctorId: item.doctorId,
                patientId: item.patientId,
                timeType: item.timeType,
                date,
                email: item.patientData ? item.patientData.email : '',
                patientName: item.patientData ? item.patientData.firstName : ''
            }
        })
    }

    cancelBooking = async (dataChild) => {
        let res = await postCancelBooking({
            ...dataChild,
            language: this.props.language
        });

        if (res && res.errCode === 0) {
            toast.success('Hủy lịch hẹn thành công!');
            this.setState({ isOpenCancelModal: false });
            await this.getDataPatient();
        } else {
            toast.error('Hủy lịch hẹn thất bại!');
        }
    }

    getStatusBadge = (statusId) => {
        let { language } = this.props;
        let statusConfig = {
            'S1': { label: language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending', bg: '#fff3e0', color: '#e65100', border: '#ffe0b2', icon: 'fa-clock' },
            'S2': { label: language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed', bg: '#e3f2fd', color: '#0d47a1', border: '#bbdefb', icon: 'fa-check-circle' },
            'S3': { label: language === LANGUAGES.VI ? 'Đã khám' : 'Completed', bg: '#e8f5e9', color: '#1b5e20', border: '#c8e6c9', icon: 'fa-check-double' },
            'S4': { label: language === LANGUAGES.VI ? 'Đã hủy' : 'Cancelled', bg: '#ffebee', color: '#c62828', border: '#ffcdd2', icon: 'fa-times-circle' }
        };

        let config = statusConfig[statusId] || statusConfig['S1'];
        return (
            <span className="status-badge" style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`, padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <i className={`fa-solid ${config.icon}`}></i> {config.label}
            </span>
        );
    }

    getActionButtons = (item) => {
        let { language } = this.props;

        return (
            <div className="d-flex gap-2 justify-content-center">
                <button
                    className='btn btn-sm btn-outline-info rounded-pill px-3'
                    onClick={() => this.handleBtnViewInfo(item)}
                >
                    <i className="fas fa-id-card"></i> {language === LANGUAGES.VI ? 'Chi tiết' : 'Details'}
                </button>

                {item.statusId === 'S2' && item.weight && item.height && item.bloodPressure && item.temperature ? (
                    <button
                        className='btn btn-sm btn-doctor rounded-pill px-3'
                        onClick={() => this.handleBtnConfirm(item)}
                    >
                        <i className="fas fa-stethoscope"></i> {language === LANGUAGES.VI ? 'Khám bệnh' : 'Examine'}
                    </button>
                ) : item.statusId === 'S2' && (
                    <span className="badge bg-light text-muted border border-secondary-subtle px-3 py-2 rounded-pill" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fas fa-user-clock"></i> {language === LANGUAGES.VI ? 'Chờ tiếp nhận' : 'Waiting Check-in'}
                    </span>
                )}

                {item.statusId === 'S3' && (
                    <button
                        className='btn btn-sm btn-outline-success rounded-pill px-3'
                        onClick={() => this.handleBtnConfirm(item, true)}
                    >
                        <i className="fas fa-file-medical"></i> {language === LANGUAGES.VI ? 'Xem bệnh án' : 'View record'}
                    </button>
                )}
            </div>
        );
    }

    render() {
        let { filteredPatients, isLoading, currentDate, statusFilter, searchKeyword, isOpenRemedyModal, dataModal, isOpenCancelModal } = this.state;
        let { language } = this.props;

        let stats = {
            total: this.state.dataPatient.length,
            pending: this.state.dataPatient.filter(b => b.statusId === 'S1').length,
            confirmed: this.state.dataPatient.filter(b => b.statusId === 'S2').length,
            completed: this.state.dataPatient.filter(b => b.statusId === 'S3').length,
            cancelled: this.state.dataPatient.filter(b => b.statusId === 'S4').length
        };

        return (
            <>
                <div className="manage-patient-container container-fluid">
                    {/* Header & Stats Card */}
                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                        <div className="card-body p-4">
                            {/* Header */}
                            <div className="row align-items-center mb-4">
                                <div className="col-md-6">
                                    <h4 className="text-doctor font-weight-bold mb-0">
                                        <i className="fa-solid fa-user-injured me-2"></i>
                                        {language === LANGUAGES.VI ? 'Quản lý bệnh nhân khám bệnh' : 'Manage Patients'}
                                    </h4>
                                    <p className="text-secondary small mb-0 mt-1">
                                        {language === LANGUAGES.VI ? 'Xem, lọc danh sách bệnh nhân và thực hiện khám bệnh' : 'View, filter patient list and conduct medical examinations'}
                                    </p>
                                </div>
                            </div>

                            {/* Statistics Cards */}
                            <div className="row g-3 mb-4">
                                <div className="col-6 col-md-3">
                                    <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                        <div className="stat-icon bg-doctor-light text-doctor rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                            <i className="fa-solid fa-users"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-dark fs-6">{stats.total}</div>
                                            <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Tổng cộng' : 'Total'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
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
                                <div className="col-6 col-md-3">
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
                                <div className="col-6 col-md-3">
                                    <div className="stat-card p-3 border rounded-3 bg-light d-flex align-items-center gap-3">
                                        <div className="stat-icon bg-success-light text-success rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                                            <i className="fa-solid fa-check-double"></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-dark fs-6">{stats.completed}</div>
                                            <div className="text-secondary small" style={{ fontSize: '11px' }}>{language === LANGUAGES.VI ? 'Đã khám' : 'Completed'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="row g-3 align-items-end border-top pt-4">
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
                                            className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'all' ? 'btn-doctor' : 'btn-outline-doctor'}`}
                                            onClick={() => this.handleStatusFilterChange('all')}
                                        >
                                            {language === LANGUAGES.VI ? 'Tất cả' : 'All'} ({stats.total})
                                        </button>
                                        <button
                                            className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S1' ? 'btn-doctor' : 'btn-outline-doctor'}`}
                                            onClick={() => this.handleStatusFilterChange('S1')}
                                        >
                                            {language === LANGUAGES.VI ? 'Chờ' : 'Pending'} ({stats.pending})
                                        </button>
                                        <button
                                            className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S2' ? 'btn-doctor' : 'btn-outline-doctor'}`}
                                            onClick={() => this.handleStatusFilterChange('S2')}
                                        >
                                            {language === LANGUAGES.VI ? 'Xác nhận' : 'Confirmed'} ({stats.confirmed})
                                        </button>
                                        <button
                                            className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S4' ? 'btn-doctor' : 'btn-outline-doctor'}`}
                                            onClick={() => this.handleStatusFilterChange('S4')}
                                        >
                                            {language === LANGUAGES.VI ? 'Hủy' : 'Cancelled'} ({stats.cancelled})
                                        </button>
                                        <button
                                            className={`btn btn-sm rounded-pill px-3 ${statusFilter === 'S3' ? 'btn-doctor' : 'btn-outline-doctor'}`}
                                            onClick={() => this.handleStatusFilterChange('S3')}
                                        >
                                            {language === LANGUAGES.VI ? 'Đã khám' : 'Completed'} ({stats.completed})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="card shadow-sm border-0 rounded-3">
                        <div className="card-body p-4">
                            <div className="row align-items-center mb-4">
                                <div className="col-md-6">
                                    <h4 className="text-doctor font-weight-bold mb-0">
                                        <i className="fa-solid fa-list me-2"></i>
                                        {language === LANGUAGES.VI ? 'Danh sách bệnh nhân khám bệnh' : 'Patients List'}
                                    </h4>
                                    <p className="text-secondary small mb-0 mt-1">
                                        {language === LANGUAGES.VI ? `Tổng số: ${filteredPatients.length} bệnh nhân` : `Total: ${filteredPatients.length} patients`}
                                    </p>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light text-secondary">
                                        <tr>
                                            <th>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Thời gian' : 'Time'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Họ và tên' : 'Full Name'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Địa chỉ' : 'Address'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Giới tính' : 'Gender'}</th>
                                            <th>{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</th>
                                            <th className="text-center">{language === LANGUAGES.VI ? 'Thao tác' : 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    <i className="fa-solid fa-spinner fa-spin me-2 text-doctor"></i>
                                                    {language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}
                                                </td>
                                            </tr>
                                        ) : filteredPatients.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4 text-muted">
                                                    {language === LANGUAGES.VI ? 'Không có bệnh nhân nào' : 'No patients found'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPatients.map((item, index) => {
                                                let time = language === LANGUAGES.VI
                                                    ? item?.timeTypeDataPatient?.valueVi || ''
                                                    : item?.timeTypeDataPatient?.valueEn || '';
                                                let gender = language === LANGUAGES.VI
                                                    ? item?.patientData?.genderData?.valueVi || ''
                                                    : item?.patientData?.genderData?.valueEn || '';
                                                    
                                                return (
                                                    <tr key={index}>
                                                        <td>
                                                            <span className="fw-bold text-dark" style={{ color: '#000' }}>#{item.queueNumber || index + 1}</span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-primary-light text-primary border border-primary-subtle p-2">
                                                                <i className="fa-solid fa-clock me-1"></i> {time}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="fw-bold text-dark">
                                                                {item.patientData ? `${item.patientData.lastName || ''} ${item.patientData.firstName || ''}` : '—'}
                                                            </div>
                                                            <div className="text-secondary small mt-1">
                                                                <i className="fa-solid fa-phone me-1"></i> {item.patientData?.phonenumber || '—'}
                                                            </div>
                                                        </td>
                                                        <td>{item.patientData?.address || '—'}</td>
                                                        <td>{gender || '—'}</td>
                                                        <td>
                                                            {this.getStatusBadge(item.statusId)}
                                                        </td>
                                                        <td className="text-center">
                                                            {this.getActionButtons(item)}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <MedicalRecordModal
                    isOpenModal={isOpenRemedyModal}
                    dataModal={dataModal}
                    closeRemedyModal={this.closeRemedyModal}
                    sendRemedy={this.sendRemedy}
                />

                <CancelBookingModal
                    isOpenModal={isOpenCancelModal}
                    dataModal={dataModal}
                    closeCancelModal={() => this.setState({ isOpenCancelModal: false })}
                    cancelBooking={this.cancelBooking}
                />

                <PatientInfoModal
                    isOpenModal={this.state.isOpenPatientInfoModal}
                    dataModal={this.state.patientInfoData}
                    closePatientInfoModal={this.closePatientInfoModal}
                />
            </>
        )
    }
}

const mapStateToProps = state => ({
    language: state.app.language,
    user: state.user.userInfo,
});

export default connect(mapStateToProps)(ManagePatient);
