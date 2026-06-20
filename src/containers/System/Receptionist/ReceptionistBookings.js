import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LANGUAGES } from '../../../utils';
import { 
    getAllUsers, 
    getAllSpecialty, 
    getDoctorsBySpecialty, 
    getScheduleDoctorByDate, 
    postPatientBookingAppointment,
    getAllBookings,
    updateBookingStatus
} from '../../../services/userService';
import { toast } from 'react-toastify';
import DatePicker from '../../../components/Input/DatePicker';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import moment from 'moment';

class ReceptionistBookings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            patients: [],
            specialties: [],
            doctors: [],
            timeSlots: [],
            allBookings: [],
            isLoading: false,

            // Filter state for bookings table
            filterDate: new Date(),
            filterSpecialty: 'all',
            filterDoctor: 'all',

            // Booking form state
            selectedPatientId: '',
            selectedSpecialtyId: '',
            selectedDoctorId: '',
            bookingDate: new Date(),
            selectedTimeSlot: '',
            reason: '',

            // Cancel Modal state
            isOpenCancelModal: false,
            bookingToCancel: null,
            cancelReason: ''
        }
    }

    async componentDidMount() {
        await this.loadPatients();
        await this.loadSpecialties();
        await this.loadBookingsList();
    }

    loadPatients = async () => {
        try {
            let res = await getAllUsers('ALL');
            if (res && res.errCode === 0) {
                let activePatients = res.users.filter(u => u.roleId === 'R3');
                this.setState({ patients: activePatients });
            }
        } catch (e) {
            console.error(e);
        }
    }

    loadSpecialties = async () => {
        try {
            let res = await getAllSpecialty();
            if (res && res.errCode === 0) {
                this.setState({ specialties: res.data });
            }
        } catch (e) {
            console.error(e);
        }
    }

    loadBookingsList = async () => {
        this.setState({ isLoading: true });
        try {
            let { filterDate } = this.state;
            let formattedDate = filterDate ? new Date(filterDate).setHours(0,0,0,0) : '';

            let res = await getAllBookings({
                date: formattedDate
            });

            if (res && res.errCode === 0) {
                this.setState({ allBookings: res.data });
            }
        } catch (e) {
            console.error(e);
        }
        this.setState({ isLoading: false });
    }

    handleOnchangeFilterDate = (date) => {
        this.setState({
            filterDate: date[0]
        }, async () => {
            await this.loadBookingsList();
        });
    }

    handleSpecialtyChange = async (event) => {
        let specialtyId = event.target.value;
        this.setState({
            selectedSpecialtyId: specialtyId,
            selectedDoctorId: '',
            timeSlots: [],
            selectedTimeSlot: ''
        });

        if (specialtyId) {
            try {
                let res = await getDoctorsBySpecialty(specialtyId);
                if (res && res.errCode === 0) {
                    this.setState({ doctors: res.data });
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            this.setState({ doctors: [] });
        }
    }

    handleDoctorChange = async (event) => {
        let doctorId = event.target.value;
        this.setState({
            selectedDoctorId: doctorId,
            timeSlots: [],
            selectedTimeSlot: ''
        }, () => {
            this.loadAvailableTimes();
        });
    }

    handleBookingDateChange = (date) => {
        this.setState({
            bookingDate: date[0],
            selectedTimeSlot: '',
            timeSlots: []
        }, () => {
            this.loadAvailableTimes();
        });
    }

    loadAvailableTimes = async () => {
        let { selectedDoctorId, bookingDate } = this.state;
        if (!selectedDoctorId || !bookingDate) return;

        let dateStr = new Date(bookingDate).setHours(0,0,0,0);
        try {
            let res = await getScheduleDoctorByDate(selectedDoctorId, dateStr);
            if (res && res.errCode === 0) {
                this.setState({ timeSlots: res.data });
            }
        } catch (e) {
            console.error(e);
        }
    }

    handleBookAppointment = async () => {
        let { selectedPatientId, selectedDoctorId, bookingDate, selectedTimeSlot, reason, patients, doctors, timeSlots } = this.state;
        let isVi = this.props.language === LANGUAGES.VI;

        if (!selectedPatientId || !selectedDoctorId || !bookingDate || !selectedTimeSlot) {
            toast.error(isVi ? 'Vui lòng chọn đầy đủ thông tin đặt lịch!' : 'Please complete all appointment fields!');
            return;
        }

        let patient = patients.find(p => p.id === +selectedPatientId);
        let doctor = doctors.find(d => d.id === +selectedDoctorId);
        let timeObj = timeSlots.find(t => t.timeType === selectedTimeSlot);

        if (!patient || !doctor || !timeObj) return;

        let formattedDate = new Date(bookingDate).setHours(0,0,0,0);

        try {
            let res = await postPatientBookingAppointment({
                email: patient.email,
                fullName: `${patient.lastName || ''} ${patient.firstName || ''}`,
                phoneNumber: patient.phonenumber,
                birthday: patient.birthday,
                selectedGender: patient.gender,
                address: patient.address,
                doctorId: selectedDoctorId,
                date: formattedDate,
                timeType: selectedTimeSlot,
                timeString: isVi ? timeObj.timeTypeData.valueVi : timeObj.timeTypeData.valueEn,
                doctorName: `${doctor.lastName || ''} ${doctor.firstName || ''}`,
                reason: reason || (isVi ? 'Đăng ký trực tiếp tại quầy' : 'Registered at receptionist counter'),
                language: this.props.language,
                statusId: 'S2', // Direct confirmation
                skipEmail: true // receptionist books at counter, skip confirm email
            });

            if (res && res.errCode === 0) {
                toast.success(isVi ? 'Đăng ký lịch hẹn tại quầy thành công!' : 'Counter appointment booked successfully!');
                this.setState({
                    selectedPatientId: '',
                    selectedSpecialtyId: '',
                    selectedDoctorId: '',
                    selectedTimeSlot: '',
                    reason: '',
                    timeSlots: [],
                    doctors: []
                });
                await this.loadBookingsList();
            } else {
                toast.error(res.errMessage || 'Đặt lịch thất bại');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi đặt lịch');
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

    openCancelModal = (booking) => {
        this.setState({
            bookingToCancel: booking,
            cancelReason: '',
            isOpenCancelModal: true
        });
    }

    closeCancelModal = () => {
        this.setState({
            isOpenCancelModal: false,
            bookingToCancel: null,
            cancelReason: ''
        });
    }

    handleCancelBooking = async () => {
        let { bookingToCancel, cancelReason } = this.state;
        let isVi = this.props.language === LANGUAGES.VI;

        if (!cancelReason.trim()) {
            toast.error(isVi ? 'Vui lòng nhập lý do hủy lịch!' : 'Please enter a cancellation reason!');
            return;
        }

        try {
            let res = await updateBookingStatus({
                bookingId: bookingToCancel.id,
                statusId: 'S4', // Cancelled status
                symptoms: `${bookingToCancel.symptoms || ''} [HUY: ${cancelReason}]`
            });

            if (res && res.errCode === 0) {
                toast.success(isVi ? 'Hủy lịch hẹn thành công!' : 'Appointment cancelled successfully!');
                this.closeCancelModal();
                await this.loadBookingsList();
            } else {
                toast.error(res.errMessage || 'Lỗi hủy lịch');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi máy chủ');
        }
    }

    render() {
        let { language } = this.props;
        let { 
            patients, specialties, doctors, timeSlots, allBookings, isLoading,
            filterDate, filterSpecialty, filterDoctor,
            selectedPatientId, selectedSpecialtyId, selectedDoctorId, bookingDate, selectedTimeSlot, reason,
            isOpenCancelModal, cancelReason, bookingToCancel
        } = this.state;
        let isVi = language === LANGUAGES.VI;

        // Apply local filtering to bookings list
        let filteredBookings = allBookings.filter(b => {
            if (filterDoctor !== 'all' && b.doctorId !== +filterDoctor) return false;
            return true;
        });

        return (
            <div className="receptionist-bookings-container container-fluid">
                <div className="row">
                    {/* Counter Booking Panel */}
                    <div className="col-lg-4 mb-4">
                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-body p-4">
                                <h5 className="text-purple font-weight-bold mb-3">
                                    <i className="fas fa-calendar-plus me-2"></i>
                                    {isVi ? 'Đăng ký lịch tại quầy' : 'Counter Appointment Booking'}
                                </h5>
                                <hr className="text-secondary opacity-25" />

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary">
                                        {isVi ? '1. Chọn bệnh nhân' : '1. Select Patient'} <span className="text-danger">*</span>
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={selectedPatientId}
                                        onChange={(e) => this.setState({ selectedPatientId: e.target.value })}
                                    >
                                        <option value="">{isVi ? '-- Chọn bệnh nhân --' : '-- Select Patient --'}</option>
                                        {patients && patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.lastName} {p.firstName} ({p.phonenumber || 'Không có SĐT'})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="small text-muted mt-1">
                                        {isVi ? 'Không thấy bệnh nhân? Thêm ở tab Hồ sơ bệnh nhân' : 'Patient not listed? Register them in Patient Directory first'}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary">
                                        {isVi ? '2. Chọn chuyên khoa' : '2. Select Specialty'} <span className="text-danger">*</span>
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={selectedSpecialtyId}
                                        onChange={this.handleSpecialtyChange}
                                    >
                                        <option value="">{isVi ? '-- Chọn chuyên khoa --' : '-- Select Specialty --'}</option>
                                        {specialties && specialties.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary">
                                        {isVi ? '3. Chọn bác sĩ' : '3. Select Doctor'} <span className="text-danger">*</span>
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={selectedDoctorId}
                                        onChange={this.handleDoctorChange}
                                        disabled={!selectedSpecialtyId}
                                    >
                                        <option value="">{isVi ? '-- Chọn bác sĩ --' : '-- Select Doctor --'}</option>
                                        {doctors && doctors.map(d => (
                                            <option key={d.id} value={d.id}>
                                                Bs. {d.lastName} {d.firstName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary">
                                        {isVi ? '4. Ngày hẹn khám' : '4. Appointment Date'} <span className="text-danger">*</span>
                                    </label>
                                    <DatePicker
                                        onChange={this.handleBookingDateChange}
                                        className="form-control"
                                        value={bookingDate}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary mb-2">
                                        {isVi ? '5. Chọn khung giờ' : '5. Time Slot'} <span className="text-danger">*</span>
                                    </label>
                                    <div className="time-slots-grid d-flex flex-wrap gap-2">
                                        {timeSlots && timeSlots.length > 0 ? (
                                            timeSlots.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    className={`btn btn-sm px-3 py-2 rounded ${selectedTimeSlot === t.timeType ? 'btn-purple' : 'btn-outline-purple'}`}
                                                    onClick={() => this.setState({ selectedTimeSlot: t.timeType })}
                                                >
                                                    {isVi ? t.timeTypeData.valueVi : t.timeTypeData.valueEn}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-muted small py-2">{isVi ? 'Không có ca khám / Hãy chọn ngày & bác sĩ' : 'No schedules available'}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold small text-secondary">
                                        {isVi ? '6. Lý do khám bệnh / Ghi chú của lễ tân' : '6. Reason for Visit / Note'}
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder={isVi ? 'Ví dụ: Đau đầu dai dẳng...' : 'e.g. Chronic headache...'}
                                        value={reason}
                                        onChange={(e) => this.setState({ reason: e.target.value })}
                                    />
                                </div>

                                <button 
                                    className="btn btn-purple w-100 py-2 rounded-3"
                                    onClick={this.handleBookAppointment}
                                    disabled={!selectedTimeSlot}
                                >
                                    <i className="fas fa-check-circle me-1"></i>
                                    {isVi ? 'Tạo lịch & Tiếp nhận ngay' : 'Book & Check-in Patient'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bookings List Panel */}
                    <div className="col-lg-8 mb-4">
                        <div className="card shadow-sm border-0 rounded-3 h-100">
                            <div className="card-body p-4">
                                <div className="row align-items-center mb-3">
                                    <div className="col-md-6">
                                        <h5 className="text-primary font-weight-bold mb-0">
                                            <i className="far fa-calendar-alt me-2"></i>
                                            {isVi ? 'Xem lịch hẹn đặt trong ngày' : 'Schedules Log'}
                                        </h5>
                                    </div>
                                    <div className="col-md-6 d-flex justify-content-md-end gap-3 mt-3 mt-md-0">
                                        <div style={{ width: '180px' }}>
                                            <DatePicker
                                                onChange={this.handleOnchangeFilterDate}
                                                className="form-control"
                                                value={filterDate}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <hr className="text-secondary opacity-25" />

                                {isLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light text-secondary">
                                                <tr>
                                                    <th>#</th>
                                                    <th>{isVi ? 'Bệnh nhân' : 'Patient'}</th>
                                                    <th>{isVi ? 'Bác sĩ' : 'Doctor'}</th>
                                                    <th>{isVi ? 'Giờ khám' : 'Slot'}</th>
                                                    <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                                                    <th className="text-center">{isVi ? 'Hành động' : 'Actions'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredBookings && filteredBookings.length > 0 ? (
                                                    filteredBookings.map((b, idx) => {
                                                        let p = b.patientData || {};
                                                        let d = b.doctorData || {};
                                                        return (
                                                            <tr key={b.id}>
                                                                <td>{idx + 1}</td>
                                                                <td>
                                                                    <div className="fw-bold text-dark">{p.lastName} {p.firstName}</div>
                                                                    <div className="small text-secondary">{p.phonenumber}</div>
                                                                </td>
                                                                <td>
                                                                    <div className="fw-bold">Bs. {d.lastName} {d.firstName}</div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light text-secondary border px-2 py-1">
                                                                        {b.timeTypeDataPatient ? (isVi ? b.timeTypeDataPatient.valueVi : b.timeTypeDataPatient.valueEn) : ''}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {this.getStatusBadge(b.statusId)}
                                                                </td>
                                                                <td className="text-center">
                                                                    {b.statusId !== 'S4' && b.statusId !== 'S3' ? (
                                                                        <button 
                                                                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                                            onClick={() => this.openCancelModal(b)}
                                                                        >
                                                                            <i className="fas fa-times-circle"></i> {isVi ? 'Hủy lịch' : 'Cancel'}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-muted small"><i className="fas fa-lock me-1"></i> {isVi ? 'Khóa' : 'Locked'}</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center py-4 text-muted">
                                                            {isVi ? 'Không tìm thấy lịch đặt nào' : 'No appointments scheduled'}
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
                </div>

                {/* Cancel Booking Modal */}
                <Modal isOpen={isOpenCancelModal} toggle={this.closeCancelModal} centered size="md">
                    <ModalHeader className="bg-danger text-white">
                        <span><i className="fas fa-times-circle me-2"></i> {isVi ? 'Hủy lịch khám bệnh' : 'Cancel Appointment'}</span>
                    </ModalHeader>
                    <ModalBody className="p-4">
                        {bookingToCancel && (
                            <div>
                                <div className="alert alert-warning border small mb-3">
                                    {isVi ? 'Xác nhận hủy lịch cho bệnh nhân:' : 'Confirm cancellation for patient:'}{' '}
                                    <strong>{bookingToCancel.patientData?.lastName} {bookingToCancel.patientData?.firstName}</strong>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small text-secondary">
                                        {isVi ? 'Lý do hủy lịch khám' : 'Reason for Cancellation'} <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        required
                                        placeholder={isVi ? 'Ví dụ: Bệnh nhân bận việc đột xuất...' : 'e.g. Patient emergency...'}
                                        value={cancelReason}
                                        onChange={(e) => this.setState({ cancelReason: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={this.closeCancelModal}>
                            {isVi ? 'Quay lại' : 'Go back'}
                        </Button>
                        <Button color="danger" onClick={this.handleCancelBooking}>
                            <i className="fas fa-check me-1"></i>
                            {isVi ? 'Xác nhận Hủy' : 'Confirm Cancel'}
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

export default connect(mapStateToProps, mapDispatchToProps)(ReceptionistBookings);
