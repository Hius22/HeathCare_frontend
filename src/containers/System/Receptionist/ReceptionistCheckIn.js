import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LANGUAGES } from '../../../utils';
import { getAllBookings, updateBookingStatus } from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import moment from 'moment';

class ReceptionistCheckIn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentDate: new Date(), // default to today
            bookings: [],
            searchKeyword: '',
            isLoading: false,
            selectedDoctorId: 'ALL', // default to show all

            // Vitals modal state
            isOpenVitalsModal: false,
            selectedBooking: null,
            weight: '',
            height: '',
            bloodPressure: '',
            temperature: '',
            symptoms: ''
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
                // Filter to show bookings that are NOT S4 (cancelled)
                let activeBookings = res.data.filter(b => b.statusId !== 'S4');
                this.setState({
                    bookings: activeBookings
                });
            } else {
                toast.error('Không thể tải danh sách tiếp đón!');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Không thể tải danh sách tiếp đón!');
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

    openVitalsModal = (booking) => {
        this.setState({
            selectedBooking: booking,
            weight: booking.weight || '',
            height: booking.height || '',
            bloodPressure: booking.bloodPressure || '',
            temperature: booking.temperature || '',
            symptoms: booking.symptoms || booking.reason || '',
            isOpenVitalsModal: true
        });
    }

    closeVitalsModal = () => {
        this.setState({
            isOpenVitalsModal: false,
            selectedBooking: null,
            weight: '',
            height: '',
            bloodPressure: '',
            temperature: '',
            symptoms: ''
        });
    }

    handleSaveVitals = async () => {
        let { selectedBooking, weight, height, bloodPressure, temperature, symptoms } = this.state;
        if (!selectedBooking) return;

        // Vitals format validation (simple check)
        if (!weight || !height || !bloodPressure || !temperature) {
            toast.error(this.props.language === LANGUAGES.VI ? 'Vui lòng nhập đầy đủ các chỉ số sinh tồn!' : 'Please enter all vitals indicators!');
            return;
        }

        try {
            let res = await updateBookingStatus({
                bookingId: selectedBooking.id,
                statusId: 'S2', // Set to Confirmed/Checked-in status
                weight: weight,
                height: height,
                bloodPressure: bloodPressure,
                temperature: temperature,
                symptoms: symptoms
            });

            if (res && res.errCode === 0) {
                toast.success(this.props.language === LANGUAGES.VI ? 'Tiếp nhận bệnh nhân & lưu chỉ số thành công!' : 'Checked-in patient & updated vitals successfully!');
                this.closeVitalsModal();
                await this.loadBookings();
            } else {
                toast.error(res.errMessage || 'Lỗi cập nhật chỉ số');
            }
        } catch (error) {
            console.error('Error saving vitals:', error);
            toast.error('Lỗi kết nối máy chủ');
        }
    }

    render() {
        let { language } = this.props;
        let { bookings, searchKeyword, currentDate, isOpenVitalsModal, weight, height, bloodPressure, temperature, symptoms, selectedBooking, isLoading } = this.state;
        let isVi = language === LANGUAGES.VI;

        // Get unique doctors from today's bookings for the filter dropdown
        let uniqueDoctors = [];
        let seenDoctorIds = new Set();
        bookings.forEach(b => {
            if (b.doctorData && b.doctorId && !seenDoctorIds.has(b.doctorId)) {
                seenDoctorIds.add(b.doctorId);
                uniqueDoctors.push({
                    id: b.doctorId,
                    fullName: `Bs. ${b.doctorData.lastName} ${b.doctorData.firstName}`
                });
            }
        });

        // Apply local search filter
        let filtered = bookings.filter(booking => {
            let patient = booking.patientData || {};
            let kw = searchKeyword.toLowerCase().trim();
            
            // Doctor filter
            if (this.state.selectedDoctorId !== 'ALL' && String(booking.doctorId) !== String(this.state.selectedDoctorId)) {
                return false;
            }

            if (!kw) return true;

            let name = `${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
            let phone = (patient.phonenumber || '').toLowerCase();
            let token = (booking.token || '').toLowerCase();
            
            return name.includes(kw) || phone.includes(kw) || token.includes(kw);
        });

        // Group filtered bookings by doctor
        let groupedBookings = {};
        filtered.forEach(booking => {
            let docId = booking.doctorId || 'unknown';
            if (!groupedBookings[docId]) {
                groupedBookings[docId] = {
                    doctor: booking.doctorData || { lastName: 'Bác sĩ', firstName: 'Chưa rõ' },
                    list: []
                };
            }
            groupedBookings[docId].list.push(booking);
        });

        // For each group, sort by queueNumber (numerically)
        Object.keys(groupedBookings).forEach(docId => {
            groupedBookings[docId].list.sort((a, b) => (Number(a.queueNumber) || 0) - (Number(b.queueNumber) || 0));
        });

        return (
            <div className="receptionist-checkin-container container-fluid">
                <div className="card shadow-sm border-0 rounded-3 mb-4">
                    <div className="card-body p-4">
                        <div className="row align-items-center mb-3">
                            <div className="col-md-6">
                                <h4 className="text-primary font-weight-bold mb-0">
                                    <i className="fas fa-user-check me-2"></i>
                                    {isVi ? 'Danh sách bệnh nhân đến khám hôm nay' : 'Today\'s Arriving Patients'}
                                </h4>
                                <p className="text-secondary small mb-0 mt-1">
                                    {isVi ? 'Tìm kiếm, tiếp nhận bệnh nhân và ghi nhận các chỉ số cơ bản' : 'Search, check-in, and record patient baseline vital signs'}
                                </p>
                            </div>
                            <div className="col-md-6 d-flex justify-content-md-end gap-3 mt-3 mt-md-0">
                                <div className="doctor-filter-wrapper" style={{ width: '220px' }}>
                                    <select
                                        className="form-select"
                                        value={this.state.selectedDoctorId}
                                        onChange={(e) => this.setState({ selectedDoctorId: e.target.value })}
                                        style={{ height: '38px', borderRadius: '6px', borderColor: '#ced4da' }}
                                    >
                                        <option value="ALL">{isVi ? 'Tất cả bác sĩ' : 'All Doctors'}</option>
                                        {uniqueDoctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="date-picker-wrapper" style={{ width: '200px' }}>
                                    <DatePicker
                                        onChange={this.handleOnchangeDatePicker}
                                        className="form-control"
                                        value={currentDate}
                                    />
                                </div>
                                <div className="search-wrapper" style={{ width: '250px' }}>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            placeholder={isVi ? 'Tên, SĐT, Mã đặt lịch...' : 'Name, phone, code...'}
                                            value={searchKeyword}
                                            onChange={this.handleSearchChange}
                                        />
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
                            <div className="mt-4">
                                {Object.keys(groupedBookings).length > 0 ? (
                                    Object.keys(groupedBookings).map(docId => {
                                        let group = groupedBookings[docId];
                                        let docName = `Bs. ${group.doctor.lastName} ${group.doctor.firstName}`;
                                        
                                        return (
                                            <div key={docId} className="doctor-group-card card border-0 shadow-sm rounded-3 mb-4">
                                                <div className="card-header d-flex align-items-center justify-content-between p-3" style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #9061f9 100%)', borderBottom: 'none' }}>
                                                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white" style={{ fontSize: '16px' }}>
                                                        <i className="fas fa-user-md"></i>
                                                        {docName}
                                                    </h5>
                                                    <span className="badge bg-white text-purple fw-bold px-3 py-2 rounded-pill" style={{ color: '#7c3aed' }}>
                                                        {isVi ? `${group.list.length} Bệnh nhân` : `${group.list.length} Patients`}
                                                    </span>
                                                </div>
                                                <div className="card-body p-0">
                                                    <div className="table-responsive">
                                                        <table className="table table-hover align-middle mb-0">
                                                            <thead className="table-light text-secondary">
                                                                <tr>
                                                                    <th style={{ width: '60px' }}>#</th>
                                                                    <th style={{ width: '100px' }} className="text-center">{isVi ? 'STT Khám' : 'Queue No.'}</th>
                                                                    <th style={{ width: '120px' }}>{isVi ? 'Mã lịch' : 'Booking ID'}</th>
                                                                    <th>{isVi ? 'Họ và tên' : 'Patient Name'}</th>
                                                                    <th>{isVi ? 'Thông tin liên hệ' : 'Contact'}</th>
                                                                    <th>{isVi ? 'Khung giờ' : 'Time Slot'}</th>
                                                                    <th>{isVi ? 'Chỉ số ban đầu' : 'Initial Vitals'}</th>
                                                                    <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                                                                    <th className="text-center" style={{ width: '160px' }}>{isVi ? 'Thao tác' : 'Actions'}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.list.map((booking, idx) => {
                                                                    let patient = booking.patientData || {};
                                                                    let isVitalsRecorded = booking.weight && booking.height && booking.bloodPressure && booking.temperature;
                                                                    
                                                                    return (
                                                                        <tr key={booking.id}>
                                                                            <td>{idx + 1}</td>
                                                                            <td className="text-center">
                                                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                                                    <span className="stt-badge-circle">
                                                                                        {booking.queueNumber ? String(booking.queueNumber).padStart(2, '0') : '—'}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="text-monospace text-danger font-weight-bold" style={{ fontSize: '13px' }}>
                                                                                {booking.token ? booking.token.substring(0, 8).toUpperCase() : '—'}
                                                                            </td>
                                                                            <td>
                                                                                <div className="fw-bold text-dark">{patient.lastName} {patient.firstName}</div>
                                                                                <div className="text-muted small">{patient.genderData ? (isVi ? patient.genderData.valueVi : patient.genderData.valueEn) : ''} | {patient.birthday ? moment(+patient.birthday).format('DD/MM/YYYY') : '—'}</div>
                                                                            </td>
                                                                            <td>
                                                                                <div><i className="fas fa-phone-alt text-muted small me-1"></i> {patient.phonenumber}</div>
                                                                                <div className="text-muted small"><i className="far fa-envelope me-1"></i> {patient.email}</div>
                                                                            </td>
                                                                            <td>
                                                                                <div className="small fw-semibold text-secondary">
                                                                                    <i className="far fa-clock me-1 text-primary"></i>
                                                                                    {booking.timeTypeDataPatient ? (isVi ? booking.timeTypeDataPatient.valueVi : booking.timeTypeDataPatient.valueEn) : ''}
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                {isVitalsRecorded ? (
                                                                                    <span className="badge bg-success-light text-success border border-success-subtle p-2">
                                                                                        <i className="fas fa-heartbeat me-1"></i>
                                                                                        {booking.weight}kg | {booking.height}cm | {booking.temperature}°C
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="badge bg-light text-secondary border p-2">
                                                                                        <i className="fas fa-minus-circle me-1"></i> {isVi ? 'Chưa đo' : 'No vitals'}
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td>
                                                                                {this.getStatusBadge(booking.statusId)}
                                                                            </td>
                                                                            <td className="text-center">
                                                                                {booking.statusId === 'S1' || booking.statusId === 'S2' ? (
                                                                                    <button 
                                                                                        className={`btn btn-sm ${isVitalsRecorded ? 'btn-outline-purple' : 'btn-purple'} px-3 rounded-pill`}
                                                                                        onClick={() => this.openVitalsModal(booking)}
                                                                                    >
                                                                                        <i className={`fas ${isVitalsRecorded ? 'fa-edit' : 'fa-check'} me-1`}></i>
                                                                                        {isVitalsRecorded ? (isVi ? 'Sửa chỉ số' : 'Edit Vitals') : (isVi ? 'Tiếp nhận' : 'Check-in')}
                                                                                    </button>
                                                                                ) : (
                                                                                    <span className="text-muted small"><i className="fas fa-lock me-1"></i> {isVi ? 'Đã khóa' : 'Locked'}</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="card border-0 shadow-sm rounded-3 p-5 text-center text-muted">
                                        <i className="fas fa-calendar-times fa-3x mb-3 text-secondary-light"></i>
                                        <h5>{isVi ? 'Không tìm thấy lịch đặt nào cho ngày này' : 'No appointments found for this day'}</h5>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Vitals Recording Modal */}
                <Modal isOpen={isOpenVitalsModal} toggle={this.closeVitalsModal} centered size="md">
                    <div className="modal-header bg-purple text-white">
                        <h5 className="modal-title">
                            <i className="fas fa-weight me-2"></i>
                            {isVi ? 'Đo chỉ số sinh tồn ban đầu' : 'Initial Vital Signs Entry'}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={this.closeVitalsModal}></button>
                    </div>
                    <ModalBody className="p-4">
                        {selectedBooking && (
                            <div>
                                <div className="patient-profile-snippet mb-3 p-3 bg-light rounded-3 border">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="fw-bold text-dark mb-0">
                                            {selectedBooking.patientData?.lastName} {selectedBooking.patientData?.firstName}
                                        </h6>
                                        <span className="badge bg-light text-dark border border-secondary-subtle fw-bold px-2 py-1" style={{ fontSize: '12px', color: '#000' }}>
                                            {isVi ? 'STT:' : 'Queue No:'} {selectedBooking.queueNumber || '—'}
                                        </span>
                                    </div>
                                    <div className="small text-secondary">
                                        {isVi ? 'Mã số:' : 'Booking ID:'} <span className="text-monospace fw-bold text-danger">{selectedBooking.token?.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="small text-secondary">
                                        {isVi ? 'Khám với:' : 'Doctor:'} Bs. {selectedBooking.doctorData?.lastName} {selectedBooking.doctorData?.firstName}
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">
                                            {isVi ? 'Cân nặng (kg)' : 'Weight (kg)'} <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. 65"
                                            value={weight}
                                            onChange={(e) => this.setState({ weight: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">
                                            {isVi ? 'Chiều cao (cm)' : 'Height (cm)'} <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. 170"
                                            value={height}
                                            onChange={(e) => this.setState({ height: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">
                                            {isVi ? 'Huyết áp (mmHg)' : 'Blood Pressure (mmHg)'} <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. 120/80"
                                            value={bloodPressure}
                                            onChange={(e) => this.setState({ bloodPressure: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-bold small text-secondary">
                                            {isVi ? 'Nhiệt độ (°C)' : 'Temperature (°C)'} <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. 36.5"
                                            value={temperature}
                                            onChange={(e) => this.setState({ temperature: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-12 mt-3">
                                        <label className="form-label fw-bold small text-secondary">
                                            {isVi ? 'Triệu chứng ban đầu / Lý do khám' : 'Initial Symptoms / Reason'}
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder={isVi ? 'Mô tả triệu chứng ban đầu bệnh nhân báo lại...' : 'Initial complaints...'}
                                            value={symptoms}
                                            onChange={(e) => this.setState({ symptoms: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.closeVitalsModal}>
                            {isVi ? 'Hủy' : 'Cancel'}
                        </Button>
                        <Button className="btn-purple" onClick={this.handleSaveVitals}>
                            <i className="fas fa-save me-1"></i>
                            {isVi ? 'Lưu & Tiếp nhận' : 'Save & Check-in'}
                        </Button>
                    </ModalFooter>
                </Modal>
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

export default connect(mapStateToProps, mapDispatchToProps)(ReceptionistCheckIn);
