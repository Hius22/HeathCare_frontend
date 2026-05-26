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
        this.setState({ isLoading: true });
        try {
            let { user } = this.props;
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
            toast.error('Failed to load patients');
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

    handleBtnConfirm = (item) => {
        let data = {
            doctorId: item.doctorId,
            patientId: item.patientId,
            email: item.patientData.email,
            timeType: item.timeType,
            patientName: item.patientData.firstName
        }
        this.setState({
            isOpenRemedyModal: true,
            dataModal: data,
        })
    }

    handleBtnViewInfo = (item) => {
        this.setState({
            isOpenPatientInfoModal: true,
            patientInfoData: item.patientData
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
            doctorId: dataModal.doctorId,
            patientId: dataModal.patientId,
            timeType: dataModal.timeType,
            language: this.props.language,
            patientName: dataModal.patientName
        })
        if (res && res.errCode === 0) {
            toast.success('Sent successfully');
            this.closeRemedyModal();
            await this.getDataPatient();
        }
        else {
            toast.error('Send failed');
        }
    }

    handleBtnCancel = (item) => {
        let date = moment(this.state.currentDate).startOf('day').valueOf();
        this.setState({
            isOpenCancelModal: true,
            dataModal: {
                doctorId: item.doctorId,
                patientId: item.patientId,
                timeType: item.timeType,
                date,
                email: item.patientData.email,
                patientName: item.patientData.firstName
            }
        })
    }

    cancelBooking = async (dataChild) => {
        let res = await postCancelBooking({
            ...dataChild,
            language: this.props.language
        });

        if (res && res.errCode === 0) {
            toast.success('Cancelled successfully');
            this.setState({ isOpenCancelModal: false });
            await this.getDataPatient();
        } else {
            toast.error('Cancel failed');
        }
    }

    getStatusBadge = (statusId) => {
        let { language } = this.props;
        let statusConfig = {
            'S1': { label: language === LANGUAGES.VI ? 'Chờ xác nhận' : 'Pending', color: '#ff9800', icon: 'fa-clock' },
            'S2': { label: language === LANGUAGES.VI ? 'Đã xác nhận' : 'Confirmed', color: '#2196f3', icon: 'fa-check-circle' },
            'S3': { label: language === LANGUAGES.VI ? 'Đã khám' : 'Completed', color: '#4caf50', icon: 'fa-check-double' },
            'S4': { label: language === LANGUAGES.VI ? 'Đã hủy' : 'Cancelled', color: '#f44336', icon: 'fa-times-circle' }
        };

        let config = statusConfig[statusId] || statusConfig['S1'];
        return (
            <span className="status-badge" style={{ backgroundColor: config.color }}>
                <i className={`fa-solid ${config.icon}`}></i> {config.label}
            </span>
        );
    }

    getActionButtons = (item) => {
        let { language } = this.props;

        return (
            <div className="action-buttons">
                <button
                    className='btn btn-info'
                    onClick={() => this.handleBtnViewInfo(item)}
                    style={{ marginRight: '8px', color: 'white', backgroundColor: '#17a2b8', borderColor: '#17a2b8' }}
                >
                    <i className="fas fa-id-card"></i> {language === LANGUAGES.VI ? 'Chi tiết' : 'Details'}
                </button>

                {item.statusId === 'S2' && (
                    <button
                        className='btn btn-complete'
                        onClick={() => this.handleBtnConfirm(item)}
                    >
                        <i className="fas fa-stethoscope"></i> {language === LANGUAGES.VI ? 'Khám bệnh' : 'Examine'}
                    </button>
                )}

                {(item.statusId === 'S1' || item.statusId === 'S2') && (
                    <button
                        className='btn btn-cancel'
                        onClick={() => this.handleBtnCancel(item)}
                    >
                        <i className="fa-solid fa-times"></i> {language === LANGUAGES.VI ? 'Hủy' : 'Cancel'}
                    </button>
                )}
            </div>
        );
    }

    render() {
        let { filteredPatients, isLoading, currentDate, statusFilter, searchKeyword, isOpenRemedyModal, dataModal, isOpenCancelModal } = this.state;
        let { language } = this.props;

        // Statistics
        let stats = {
            total: this.state.dataPatient.length,
            pending: this.state.dataPatient.filter(b => b.statusId === 'S1').length,
            confirmed: this.state.dataPatient.filter(b => b.statusId === 'S2').length,
            completed: this.state.dataPatient.filter(b => b.statusId === 'S3').length,
            cancelled: this.state.dataPatient.filter(b => b.statusId === 'S4').length
        };

        return (
            <>
                <div className="manage-patient-container">
                    <div className="manage-patient-header">
                        <h2>
                            <i className="fa-solid fa-user-injured"></i>
                            {language === LANGUAGES.VI ? 'Quản lý bệnh nhân khám bệnh' : 'Manage Patients'}
                        </h2>
                    </div>

                    {/* Statistics Cards */}
                    <div className="stats-cards">
                        <div className="stat-card stat-total">
                            <div className="stat-icon">
                                <i className="fa-solid fa-users"></i>
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
                                <div className="stat-label">{language === LANGUAGES.VI ? 'Đã khám' : 'Completed'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="patient-filters">
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
                                    {language === LANGUAGES.VI ? 'Đã khám' : 'Completed'} ({stats.completed})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="patients-table-container">
                        <div className="table-header-bar">
                            <h3><i className="fas fa-list-alt"></i> Danh Sách Bệnh Nhân</h3>
                            <span className="record-count">Tổng: {filteredPatients.length} bệnh nhân</span>
                        </div>

                        {isLoading ? (
                            <div className="loading">
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>{language === LANGUAGES.VI ? 'Đang tải...' : 'Loading...'}</span>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="no-data">
                                <i className="fa-solid fa-users-slash"></i>
                                <p>{language === LANGUAGES.VI ? 'Không có bệnh nhân nào' : 'No patients found'}</p>
                            </div>
                        ) : (
                            <table className="patients-table">
                                <thead>
                                    <tr>
                                        <th>{language === LANGUAGES.VI ? 'STT' : 'No.'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Thời gian' : 'Time'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Họ và tên' : 'Full Name'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Địa chỉ' : 'Address'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Giới tính' : 'Gender'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Trạng thái' : 'Status'}</th>
                                        <th>{language === LANGUAGES.VI ? 'Thao tác' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map((item, index) => {
                                        let time = language === LANGUAGES.VI
                                            ? item?.timeTypeDataPatient?.valueVi || ''
                                            : item?.timeTypeDataPatient?.valueEn || '';
                                        let gender = language === LANGUAGES.VI
                                            ? item?.patientData?.genderData?.valueVi || ''
                                            : item?.patientData?.genderData?.valueEn || '';
                                            
                                        return (
                                            <tr key={index} className={`patient-row status-${item.statusId}`}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="time-info">
                                                        <div><i className="fa-solid fa-clock"></i> {time}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="patient-info">
                                                        <div className="patient-name">
                                                            {item.patientData.firstName} {item.patientData.lastName || ''}
                                                        </div>
                                                        <div className="patient-contact">
                                                            <i className="fa-solid fa-phone"></i> {item.patientData.phonenumber || '—'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{item.patientData.address || '—'}</td>
                                                <td>{gender || '—'}</td>
                                                <td>
                                                    {this.getStatusBadge(item.statusId)}
                                                </td>
                                                <td>
                                                    {this.getActionButtons(item)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
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

const mapDispatchToProps = dispatch => {
    return {
    };
}

export default connect(mapStateToProps)(ManagePatient);
