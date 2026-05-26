import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import HomeHeader from '../HomePage/HomeHeader';
import HomeFooter from '../HomePage/HomeFooter';
import './BookingFlow.scss';
import { getAllSpecialty, getAllDoctors, postPatientBookingAppointment, getDetailSpecialtyById, getDetailInforDoctor, getScheduleDoctorByDate, getDoctorsBySpecialty } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';
import * as actions from '../../store/actions';
import { LANGUAGES } from '../../utils';

class BookingFlow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentStep: 1,
            specialties: [],
            doctors: [],
            filteredDoctors: [],
            selectedSpecialty: '',
            selectedDoctor: null,
            selectedDate: '',
            selectedTime: '',
            selectedTimeSlot: null,
            availableTimeSlots: [],
            appointmentType: 'offline',
            selectedFacility: '',
            patientInfo: {
                fullName: '',
                phoneNumber: '',
                email: '',
                address: '',
                birthday: '',
                gender: '',
                reason: ''
            }
        };
    }

    async componentDidMount() {
        this.props.getGenders();
        await this.loadSpecialties();
        await this.loadDoctors();
        // Pre-fill from Hero search query params
        this.applyQueryParams();
    }

    applyQueryParams = async () => {
        if (!this.props.location || !this.props.location.search) return;
        const params = new URLSearchParams(this.props.location.search);
        const specialtyId = params.get('specialtyId');
        const doctorId    = params.get('doctorId');
        const date        = params.get('date');

        if (!specialtyId && !doctorId && !date) return;

        const { doctors } = this.state;
        let updates = {};

        if (specialtyId) {
            updates.selectedSpecialty = specialtyId;
            try {
                let res = await getDoctorsBySpecialty(specialtyId);
                if (res && res.errCode === 0) {
                    updates.filteredDoctors = res.data || [];
                }
            } catch (e) {
                // fallback: filter local
                updates.filteredDoctors = doctors.filter(d =>
                    d.doctorSpecialties && d.doctorSpecialties.some(ds =>
                        String(ds.specialtyId) === String(specialtyId)
                    )
                );
            }
        }

        if (doctorId) {
            const found = doctors.find(d => String(d.id) === String(doctorId));
            if (found) updates.selectedDoctor = found;
        }

        if (date) updates.selectedDate = date;

        if (Object.keys(updates).length > 0) {
            this.setState(updates);
        }
    }

    loadSpecialties = async () => {
        try {
            let res = await getAllSpecialty();
            if (res && res.errCode === 0) {
                this.setState({ specialties: res.data || [] });
            }
        } catch (error) {
            console.error('Error loading specialties:', error);
        }
    }

    loadDoctors = async () => {
        try {
            let res = await getAllDoctors();
            if (res && res.errCode === 0) {
                // Fetch detailed info for each doctor to get specialty, price, and image
                let doctorsWithDetails = await Promise.all(
                    (res.data || []).map(async (doctor) => {
                        try {
                            let detailRes = await getDetailInforDoctor(doctor.id);
                            if (detailRes && detailRes.errCode === 0 && detailRes.data) {
                                return {
                                    ...doctor,
                                    // Use image from detail response if available
                                    image: detailRes.data.image || doctor.image || '',
                                    Doctor_Infor: detailRes.data.Doctor_Infor || null,
                                    MarkDown: detailRes.data.MarkDown || null
                                };
                            }
                        } catch (error) {
                            console.error(`Error loading doctor ${doctor.id}:`, error);
                        }
                        return doctor;
                    })
                );

                this.setState({
                    doctors: doctorsWithDetails,
                    filteredDoctors: doctorsWithDetails
                });
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    }

    nextStep = () => {
        if (this.validateStep()) {
            this.setState(prevState => ({
                currentStep: Math.min(prevState.currentStep + 1, 4)
            }));
        }
    }

    prevStep = () => {
        this.setState(prevState => ({
            currentStep: Math.max(prevState.currentStep - 1, 1)
        }));
    }

    validateStep = () => {
        const { currentStep, selectedSpecialty, selectedDoctor, selectedDate, selectedTime, patientInfo } = this.state;

        if (currentStep === 1) {
            if (!selectedSpecialty) {
                toast.error('Vui lòng chọn chuyên khoa');
                return false;
            }
            if (!selectedDoctor) {
                toast.error('Vui lòng chọn bác sĩ');
                return false;
            }
        }

        if (currentStep === 2) {
            if (!selectedDate) {
                toast.error('Vui lòng chọn ngày khám');
                return false;
            }
            if (!selectedTime) {
                toast.error('Vui lòng chọn giờ khám');
                return false;
            }
        }

        if (currentStep === 3) {
            if (!patientInfo.fullName.trim()) {
                toast.error('Vui lòng nhập họ tên');
                return false;
            }
            if (!patientInfo.phoneNumber.trim()) {
                toast.error('Vui lòng nhập số điện thoại');
                return false;
            }
            if (!patientInfo.address.trim()) {
                toast.error('Vui lòng nhập địa chỉ');
                return false;
            }
            if (!patientInfo.gender) {
                toast.error('Vui lòng chọn giới tính');
                return false;
            }
        }

        return true;
    }

    getSpecialtyName = (doctor) => {
        const { specialties } = this.state;

        if (doctor && doctor.Doctor_Infor && doctor.Doctor_Infor.specialtyId) {
            const specialty = specialties.find(s => s.id === doctor.Doctor_Infor.specialtyId);
            return specialty ? specialty.name : 'Chưa cập nhật';
        }
        return 'Chưa cập nhật';
    }

    getDoctorPrice = (doctor) => {
        if (doctor && doctor.Doctor_Infor && doctor.Doctor_Infor.priceTypeData) {
            let price = doctor.Doctor_Infor.priceTypeData.valueVi;
            // Format price with thousand separator
            return Number(price).toLocaleString('vi-VN') + ' VND';
        }
        return 'Liên hệ';
    }

    handleDoctorSelect = (doctor) => {
        this.setState({ selectedDoctor: doctor });

        // If date is already selected, load time slots for this doctor
        if (this.state.selectedDate) {
            this.loadAvailableTimeSlots(doctor.id, this.state.selectedDate);
        }
    }

    handleDateChange = (date) => {
        this.setState({
            selectedDate: date,
            selectedTime: '' // Reset selected time when date changes
        });

        // If doctor is already selected, load time slots for this date
        if (this.state.selectedDoctor) {
            this.loadAvailableTimeSlots(this.state.selectedDoctor.id, date);
        }
    }

    handleTimeSelect = (timeSlot) => {
        this.setState({
            selectedTime: timeSlot.timeType,
            selectedTimeSlot: timeSlot
        });
    }

    loadAvailableTimeSlots = async (doctorId, date) => {
        if (!doctorId || !date) {
            this.setState({ availableTimeSlots: [] });
            return;
        }

        try {
            // Convert date to timestamp format used by the API
            let dateTimestamp = moment(date).startOf('day').valueOf();

            let res = await getScheduleDoctorByDate(doctorId, dateTimestamp);

            if (res && res.errCode === 0 && res.data) {
                // Filter out past time slots if date is today
                let availableTimes = res.data.filter(item => {
                    const isToday = moment(+item.date).isSame(moment(), 'day');
                    if (!isToday) return true;

                    // Filter past times for today
                    const currentHour = moment().hour();
                    const currentMinute = moment().minute();

                    const timeStr = item.timeTypeData.valueVi;
                    const [startHour, startMinute] = timeStr.split(':').map(Number);

                    // Keep only future time slots
                    return (startHour > currentHour) || (startHour === currentHour && startMinute > currentMinute);
                });

                this.setState({ availableTimeSlots: availableTimes });
            } else {
                this.setState({ availableTimeSlots: [] });
            }
        } catch (error) {
            console.error('Error loading time slots:', error);
            this.setState({ availableTimeSlots: [] });
        }
    }

    handleSpecialtyChange = async (specialtyId) => {
        const { doctors } = this.state;

        // Filter doctors by selected specialty
        let filteredDocs = [];
        if (specialtyId) {
            try {
                // Get doctors for this specialty using the correct API
                let res = await getDetailSpecialtyById({
                    id: specialtyId,
                    location: 'ALL'
                });

                if (res && res.errCode === 0 && res.data) {
                    // Get doctor IDs from doctorSpecialty table
                    let doctorIds = [];
                    if (res.data.doctorSpecialty && res.data.doctorSpecialty.length > 0) {
                        res.data.doctorSpecialty.forEach(item => {
                            if (item.doctorId) {
                                doctorIds.push(item.doctorId);
                            }
                        });
                    }

                    // Filter doctors array by these IDs
                    filteredDocs = doctors.filter(doctor => doctorIds.includes(doctor.id));
                }
            } catch (error) {
                console.error('Error loading doctors for specialty:', error);
                filteredDocs = [];
            }
        } else {
            filteredDocs = doctors;
        }

        this.setState({
            selectedSpecialty: specialtyId,
            selectedDoctor: null, // Reset selected doctor when changing specialty
            filteredDoctors: filteredDocs
        });
    }

    handleConfirmBooking = async () => {
        const { selectedDoctor, selectedDate, selectedTimeSlot, appointmentType, patientInfo } = this.state;

        // Validate required fields
        if (!patientInfo.fullName || !patientInfo.phoneNumber || !patientInfo.email) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            // Convert selectedDate to timestamp format
            let dateTimestamp = moment(selectedDate).startOf('day').valueOf();

            // Convert birthday to timestamp if provided
            let birthdayTimestamp = patientInfo.birthday ? new Date(patientInfo.birthday).getTime() : '';

            let timeDisplay = this.props.language === LANGUAGES.VI ?
                selectedTimeSlot.timeTypeData.valueVi : selectedTimeSlot.timeTypeData.valueEn;
            
            let dateDisplay = this.props.language === LANGUAGES.VI ?
                moment(+dateTimestamp).locale('vi').format('dddd - DD/MM/YYYY') :
                moment(+dateTimestamp).locale('en').format('dddd - MM/DD/YYYY');

            let timeString = `${timeDisplay} - ${dateDisplay}`;

            let doctorName = this.props.language === LANGUAGES.VI ?
                `${selectedDoctor.lastName} ${selectedDoctor.firstName}` : `${selectedDoctor.firstName} ${selectedDoctor.lastName}`;

            let res = await postPatientBookingAppointment({
                fullName: patientInfo.fullName,
                phoneNumber: patientInfo.phoneNumber,
                email: patientInfo.email,
                address: patientInfo.address,
                reason: patientInfo.reason,
                date: dateTimestamp,
                birthday: birthdayTimestamp,
                selectedGender: patientInfo.gender,
                doctorId: selectedDoctor.id,
                timeType: selectedTimeSlot.timeType,
                language: this.props.language,
                timeString: timeString,
                doctorName: doctorName
            });

            if (res && res.errCode === 0) {
                toast.success('Đặt lịch khám thành công!');
                setTimeout(() => {
                    this.props.history.push('/home');
                }, 1500);
            } else {
                toast.error(res.errMessage || 'Đặt lịch thất bại');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            toast.error('Đặt lịch thất bại');
        }
    }

    renderStepIndicator = () => {
        const { currentStep } = this.state;
        const steps = [
            { number: 1, label: 'Chuyên khoa' },
            { number: 2, label: 'Ngày giờ' },
            { number: 3, label: 'Thông tin' },
            { number: 4, label: 'Xác nhận' }
        ];

        return (
            <div className='step-indicator'>
                <div className='step-indicator-inner'>
                    {steps.map((step, index) => (
                        <Fragment key={step.number}>
                            <div className='step-item'>
                                <div className={`step-dot ${currentStep >= step.number ? 'active' : ''}`}>
                                    {step.number}
                                </div>
                                <span className='step-label'>{step.label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`step-line ${currentStep > step.number ? 'active' : ''}`} />
                            )}
                        </Fragment>
                    ))}
                </div>
            </div>
        );
    }

    renderStep1 = () => {
        const { specialties, filteredDoctors, selectedSpecialty, selectedDoctor } = this.state;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>Chọn chuyên khoa và bác sĩ</h2>
                <div className='step-content'>
                    <div className='form-field'>
                        <label className='form-label'>
                            Chuyên khoa <span className='required'>*</span>
                        </label>
                        <select
                            className='form-select'
                            value={selectedSpecialty}
                            onChange={(e) => this.handleSpecialtyChange(e.target.value)}
                        >
                            <option value="">Chọn chuyên khoa</option>
                            {specialties.map(specialty => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>Chọn bác sĩ</label>
                        {filteredDoctors.length === 0 ? (
                            <div className='no-doctors-message'>
                                <i className='fa-regular fa-folder-open'></i>
                                <p>Không có bác sĩ nào cho chuyên khoa này</p>
                            </div>
                        ) : (
                            <div className='doctor-grid'>
                                {filteredDoctors.map(doctor => (
                                    <label
                                        key={doctor.id}
                                        className={`doctor-card ${selectedDoctor && selectedDoctor.id === doctor.id ? 'selected' : ''}`}
                                    >
                                        <input
                                            type='radio'
                                            name='doctor'
                                            value={doctor.id}
                                            checked={selectedDoctor && selectedDoctor.id === doctor.id}
                                            onChange={() => this.handleDoctorSelect(doctor)}
                                            className='sr-only'
                                        />
                                        <div className='doctor-card-content'>
                                            <div className='doctor-avatar'>
                                                {doctor.image ? (
                                                    <img src={doctor.image} alt={`${doctor.lastName} ${doctor.firstName}`} />
                                                ) : (
                                                    <div className='avatar-placeholder'>
                                                        {(doctor.lastName || doctor.firstName || '?').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='doctor-info'>
                                                <p className='doctor-name'>{doctor.lastName} {doctor.firstName}</p>
                                                <p className='doctor-specialty'>{this.getSpecialtyName(doctor)}</p>
                                                <p className='doctor-price'>{this.getDoctorPrice(doctor)}</p>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className='step-actions'>
                    <button className='btn-primary' onClick={this.nextStep}>
                        Tiếp theo
                        <i className='fa-solid fa-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }

    renderStep2 = () => {
        const { selectedDate, selectedTime, appointmentType, availableTimeSlots, selectedDoctor } = this.state;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>Chọn ngày, giờ và hình thức khám</h2>
                <div className='step-content'>
                    <div className='form-field'>
                        <label className='form-label'>
                            Ngày khám <span className='required'>*</span>
                        </label>
                        <input
                            type='date'
                            className='form-input'
                            value={selectedDate}
                            onChange={(e) => this.handleDateChange(e.target.value)}
                            min={moment().format('YYYY-MM-DD')}
                        />
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>Khung giờ</label>
                        {!selectedDoctor ? (
                            <div className='no-time-message'>
                                <i className='fa-solid fa-user-doctor'></i>
                                <p>Vui lòng chọn bác sĩ ở bước 1 để xem khung giờ</p>
                            </div>
                        ) : availableTimeSlots.length === 0 ? (
                            <div className='no-time-message'>
                                <i className='fa-regular fa-calendar-xmark'></i>
                                <p>Không có lịch khám trong ngày này. Vui lòng chọn ngày khác</p>
                            </div>
                        ) : (
                            <div className='time-grid'>
                                {availableTimeSlots.map((timeSlot, index) => {
                                    let timeDisplay = timeSlot.timeTypeData.valueVi;
                                    return (
                                        <button
                                            key={index}
                                            type='button'
                                            className={`time-slot ${selectedTime === timeSlot.timeType ? 'selected' : ''}`}
                                            onClick={() => this.handleTimeSelect(timeSlot)}
                                        >
                                            {timeDisplay}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>Hình thức khám</label>
                        <div className='type-grid'>
                            <label className={`type-card ${appointmentType === 'offline' ? 'selected' : ''}`}>
                                <input
                                    type='radio'
                                    name='type'
                                    value='offline'
                                    checked={appointmentType === 'offline'}
                                    onChange={() => this.setState({ appointmentType: 'offline' })}
                                    className='sr-only'
                                />
                                <div className='type-card-content'>
                                    <i className='fa-solid fa-location-dot type-icon'></i>
                                    <span className='type-title'>Khám trực tiếp</span>
                                    <p className='type-desc'>Đến cơ sở y tế để gặp bác sĩ</p>
                                </div>
                            </label>
                            <label className={`type-card ${appointmentType === 'online' ? 'selected' : ''}`}>
                                <input
                                    type='radio'
                                    name='type'
                                    value='online'
                                    checked={appointmentType === 'online'}
                                    onChange={() => this.setState({ appointmentType: 'online' })}
                                    className='sr-only'
                                />
                                <div className='type-card-content'>
                                    <i className='fa-solid fa-video type-icon'></i>
                                    <span className='type-title'>Tư vấn trực tuyến</span>
                                    <p className='type-desc'>Gặp bác sĩ qua video call</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div className='step-actions'>
                    <button className='btn-secondary' onClick={this.prevStep}>
                        <i className='fa-solid fa-arrow-left'></i>
                        Quay lại
                    </button>
                    <button className='btn-primary' onClick={this.nextStep}>
                        Tiếp theo
                        <i className='fa-solid fa-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }

    renderStep3 = () => {
        const { patientInfo } = this.state;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>Thông tin bệnh nhân</h2>
                <div className='step-content'>
                    <div className='form-row'>
                        <div className='form-field'>
                            <label className='form-label'>
                                Họ và tên <span className='required'>*</span>
                            </label>
                            <input
                                type='text'
                                className='form-input'
                                placeholder='Nguyễn Văn A'
                                value={patientInfo.fullName}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, fullName: e.target.value }
                                })}
                            />
                        </div>
                        <div className='form-field'>
                            <label className='form-label'>
                                Số điện thoại <span className='required'>*</span>
                            </label>
                            <input
                                type='tel'
                                className='form-input'
                                placeholder='0901234567'
                                value={patientInfo.phoneNumber}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, phoneNumber: e.target.value }
                                })}
                            />
                        </div>
                    </div>

                    <div className='form-row'>
                        <div className='form-field'>
                            <label className='form-label'>Email</label>
                            <input
                                type='email'
                                className='form-input'
                                placeholder='example@email.com'
                                value={patientInfo.email}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, email: e.target.value }
                                })}
                            />
                        </div>
                        <div className='form-field'>
                            <label className='form-label'>Ngày sinh</label>
                            <input
                                type='date'
                                className='form-input'
                                value={patientInfo.birthday}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, birthday: e.target.value }
                                })}
                            />
                        </div>
                    </div>

                    <div className='form-row'>
                        <div className='form-field'>
                            <label className='form-label'>
                                Địa chỉ <span className='required'>*</span>
                            </label>
                            <input
                                type='text'
                                className='form-input'
                                placeholder='Nhập địa chỉ liên hệ'
                                value={patientInfo.address}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, address: e.target.value }
                                })}
                            />
                        </div>
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>Giới tính</label>
                        <div className='gender-options'>
                            {this.props.genders && this.props.genders.length > 0 &&
                                this.props.genders.map((item, index) => {
                                    return (
                                        <label key={index} className='gender-option'>
                                            <input
                                                type='radio'
                                                name='gender'
                                                value={item.keyMap}
                                                checked={patientInfo.gender === item.keyMap}
                                                onChange={() => this.setState({
                                                    patientInfo: { ...patientInfo, gender: item.keyMap }
                                                })}
                                            />
                                            <span>{this.props.language === LANGUAGES.VI ? item.valueVi : item.valueEn}</span>
                                        </label>
                                    )
                                })
                            }
                        </div>
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>Triệu chứng / Lý do khám</label>
                        <textarea
                            className='form-input form-textarea'
                            rows='3'
                            placeholder='Mô tả ngắn gọn tình trạng sức khỏe...'
                            value={patientInfo.reason}
                            onChange={(e) => this.setState({
                                patientInfo: { ...patientInfo, reason: e.target.value }
                            })}
                        />
                    </div>
                </div>
                <div className='step-actions'>
                    <button className='btn-secondary' onClick={this.prevStep}>
                        <i className='fa-solid fa-arrow-left'></i>
                        Quay lại
                    </button>
                    <button className='btn-primary' onClick={this.nextStep}>
                        Tiếp theo
                        <i className='fa-solid fa-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }

    renderStep4 = () => {
        const { selectedDoctor, selectedDate, selectedTime, appointmentType, patientInfo } = this.state;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>Xác nhận thông tin</h2>
                <div className='review-card'>
                    <div className='review-header'>
                        <div className='review-doctor-avatar'>
                            {selectedDoctor && selectedDoctor.image ? (
                                <img src={selectedDoctor.image} alt={`${selectedDoctor.lastName} ${selectedDoctor.firstName}`} />
                            ) : (
                                <div className='avatar-placeholder'>
                                    {(selectedDoctor && (selectedDoctor.lastName || selectedDoctor.firstName || '?')).charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className='review-doctor-info'>
                            <h3 className='doctor-name'>{selectedDoctor && `${selectedDoctor.lastName} ${selectedDoctor.firstName}`}</h3>
                            <p className='doctor-specialty'>{selectedDoctor && this.getSpecialtyName(selectedDoctor)}</p>
                        </div>
                    </div>

                    <div className='review-details'>
                        <div className='detail-item'>
                            <i className='fa-regular fa-calendar'></i>
                            <div>
                                <p className='detail-label'>Ngày khám</p>
                                <p className='detail-value'>
                                    {selectedDate ? moment(selectedDate).format('dddd, DD/MM/YYYY') : 'Chưa chọn'}
                                </p>
                            </div>
                        </div>
                        <div className='detail-item'>
                            <i className='fa-regular fa-clock'></i>
                            <div>
                                <p className='detail-label'>Giờ khám</p>
                                <p className='detail-value'>{selectedTime || 'Chưa chọn'}</p>
                            </div>
                        </div>
                        <div className='detail-item'>
                            <i className='fa-solid fa-location-dot'></i>
                            <div>
                                <p className='detail-label'>Hình thức</p>
                                <p className='detail-value'>
                                    {appointmentType === 'offline' ? 'Khám trực tiếp' : 'Tư vấn trực tuyến'}
                                </p>
                            </div>
                        </div>
                        <div className='detail-item'>
                            <i className='fa-regular fa-user'></i>
                            <div>
                                <p className='detail-label'>Bệnh nhân</p>
                                <p className='detail-value'>{patientInfo.fullName || 'Chưa nhập'}</p>
                            </div>
                        </div>
                    </div>

                    <div className='review-pricing'>
                        <div className='price-row'>
                            <span>Phí khám</span>
                            <span>{selectedDoctor ? this.getDoctorPrice(selectedDoctor) : '350.000 VND'}</span>
                        </div>
                        <div className='price-row'>
                            <span>Phí đặt lịch</span>
                            <span>Miễn phí</span>
                        </div>
                        <div className='price-row total'>
                            <span>Tổng cộng</span>
                            <span>{selectedDoctor ? this.getDoctorPrice(selectedDoctor) : '350.000 VND'}</span>
                        </div>
                    </div>
                </div>

                <div className='info-alert'>
                    <i className='fa-solid fa-circle-info'></i>
                    <p>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Lịch hẹn sẽ được gửi qua SMS và Email sau khi đặt thành công.</p>
                </div>

                <div className='step-actions'>
                    <button className='btn-secondary' onClick={this.prevStep}>
                        <i className='fa-solid fa-arrow-left'></i>
                        Quay lại
                    </button>
                    <button className='btn-primary' onClick={this.handleConfirmBooking}>
                        <i className='fa-solid fa-check'></i>
                        Xác nhận đặt lịch
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const { currentStep } = this.state;

        return (
            <Fragment>
                <HomeHeader />
                <main className='booking-flow-page'>
                    <div className='booking-container'>
                        <nav className='breadcrumb' aria-label='Breadcrumb'>
                            <a href='/home'>Trang chủ</a>
                            <i className='fa-solid fa-chevron-right'></i>
                            <span className='current'>Đặt lịch khám</span>
                        </nav>

                        <div className='page-header'>
                            <h1 className='page-title'>Đặt lịch khám</h1>
                            <p className='page-subtitle'>Hoàn thành 4 bước đơn giản để đặt lịch hẹn với bác sĩ.</p>
                        </div>

                        {this.renderStepIndicator()}

                        <div className='step-content-wrapper'>
                            {currentStep === 1 && this.renderStep1()}
                            {currentStep === 2 && this.renderStep2()}
                            {currentStep === 3 && this.renderStep3()}
                            {currentStep === 4 && this.renderStep4()}
                        </div>
                    </div>
                </main>
                <HomeFooter />
            </Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    language: state.app.language,
    genders: state.admin.genders,
});

const mapDispatchToProps = dispatch => {
    return {
        getGenders: () => dispatch(actions.fetchGenderStart()),
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(BookingFlow));
