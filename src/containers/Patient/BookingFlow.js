import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import HomeHeader from '../HomePage/HomeHeader';
import HomeFooter from '../HomePage/HomeFooter';
import './BookingFlow.scss';
import { getAllSpecialty, getAllDoctors, postPatientBookingAppointment, getDetailSpecialtyById, getDetailInforDoctor, getScheduleDoctorByDate, getDoctorsBySpecialty, getPatientByEmail, getAllClinic } from '../../services/userService';
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
            clinics: [],
            selectedClinicId: '',
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
            },
            suggestedProfiles: [],
            selectedProfileIndex: -1
        };
    }

    async componentDidMount() {
        this.props.getGenders();
        await this.loadClinics();
        await this.loadSpecialties();
        await this.loadDoctors();
        // Pre-fill from Hero search query params
        this.applyQueryParams();
    }

    applyQueryParams = async () => {
        if (!this.props.location || !this.props.location.search) return;
        const params = new URLSearchParams(this.props.location.search);
        let specialtyId = params.get('specialtyId');
        const doctorId    = params.get('doctorId');
        const date        = params.get('date');
        const clinicId    = params.get('clinicId');

        if (!specialtyId && !doctorId && !date && !clinicId) return;

        const { doctors } = this.state;
        let updates = {};

        if (clinicId) {
            updates.selectedClinicId = clinicId;
        }

        if (doctorId) {
            const found = doctors.find(d => String(d.id) === String(doctorId));
            if (found) {
                updates.selectedDoctor = found;
                if (!specialtyId) {
                    if (found.doctorSpecialties && found.doctorSpecialties.length > 0) {
                        specialtyId = String(found.doctorSpecialties[0].specialtyId);
                    } else if (found.Doctor_Infor && found.Doctor_Infor.specialtyId) {
                        specialtyId = String(found.Doctor_Infor.specialtyId);
                    }
                }
            }
        }

        if (specialtyId) {
            updates.selectedSpecialty = specialtyId;
        }

        if (date) updates.selectedDate = date;

        if (Object.keys(updates).length > 0) {
            this.setState(updates, async () => {
                await this.filterDoctors(this.state.selectedSpecialty, this.state.selectedClinicId);
                const { selectedDoctor, selectedDate } = this.state;
                if (selectedDoctor && selectedDate) {
                    this.loadAvailableTimeSlots(selectedDoctor.id, selectedDate);
                    this.setState({ currentStep: 2 });
                }
            });
        }
    }

    loadClinics = async () => {
        try {
            let res = await getAllClinic();
            if (res && res.errCode === 0) {
                this.setState({ clinics: res.data || [] });
            }
        } catch (error) {
            console.error('Error loading clinics:', error);
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
        const isVi = this.props.language === LANGUAGES.VI;

        if (currentStep === 1) {
            if (!selectedSpecialty) {
                toast.error(isVi ? 'Vui lòng chọn chuyên khoa' : 'Please select a specialty');
                return false;
            }
            if (!selectedDoctor) {
                toast.error(isVi ? 'Vui lòng chọn bác sĩ' : 'Please select a doctor');
                return false;
            }
        }

        if (currentStep === 2) {
            if (!selectedDate) {
                toast.error(isVi ? 'Vui lòng chọn ngày khám' : 'Please select an appointment date');
                return false;
            }
            if (!selectedTime) {
                toast.error(isVi ? 'Vui lòng chọn giờ khám' : 'Please select an appointment time');
                return false;
            }
        }

        if (currentStep === 3) {
            if (!patientInfo.fullName.trim()) {
                toast.error(isVi ? 'Vui lòng nhập họ tên' : 'Please enter full name');
                return false;
            }
            if (!patientInfo.phoneNumber.trim()) {
                toast.error(isVi ? 'Vui lòng nhập số điện thoại' : 'Please enter phone number');
                return false;
            }
            if (!patientInfo.address.trim()) {
                toast.error(isVi ? 'Vui lòng nhập địa chỉ' : 'Please enter address');
                return false;
            }
            if (!patientInfo.gender) {
                toast.error(isVi ? 'Vui lòng chọn giới tính' : 'Please select gender');
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

                    const timeStr = item.timeTypeData?.valueVi;
                    if (!timeStr) return false;
                    
                    // Extract start time part (e.g., "08:00" from "08:00 - 09:00")
                    const startStr = timeStr.split(' - ')[0];
                    const [startHour, startMinute] = startStr.split(':').map(Number);

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

    filterDoctors = async (specialtyId, clinicId) => {
        const { doctors } = this.state;
        let filteredDocs = doctors;

        // 1. Filter by Clinic if clinicId is selected
        if (clinicId) {
            filteredDocs = filteredDocs.filter(doc => doc.Doctor_Infor && String(doc.Doctor_Infor.clinicId) === String(clinicId));
        }

        // 2. Filter by Specialty if specialtyId is selected
        if (specialtyId) {
            try {
                let res = await getDetailSpecialtyById({
                    id: specialtyId,
                    location: 'ALL'
                });

                if (res && res.errCode === 0 && res.data) {
                    let doctorIds = [];
                    if (res.data.doctorSpecialty && res.data.doctorSpecialty.length > 0) {
                        res.data.doctorSpecialty.forEach(item => {
                            if (item.doctorId) {
                                doctorIds.push(item.doctorId);
                            }
                        });
                    }
                    filteredDocs = filteredDocs.filter(doctor => doctorIds.includes(doctor.id));
                } else {
                    filteredDocs = [];
                }
            } catch (error) {
                console.error('Error loading doctors for specialty:', error);
                filteredDocs = [];
            }
        }

        this.setState({
            filteredDoctors: filteredDocs
        });
    }

    handleSpecialtyChange = async (specialtyId) => {
        this.setState({
            selectedSpecialty: specialtyId,
            selectedDoctor: null // Reset selected doctor when changing specialty
        }, async () => {
            await this.filterDoctors(this.state.selectedSpecialty, this.state.selectedClinicId);
        });
    }

    handleClinicChange = async (clinicId) => {
        this.setState({
            selectedClinicId: clinicId,
            selectedDoctor: null // Reset selected doctor when changing clinic
        }, async () => {
            await this.filterDoctors(this.state.selectedSpecialty, this.state.selectedClinicId);
        });
    }

    handleEmailChange = async (event) => {
        let email = event.target.value;
        this.setState(prevState => ({
            patientInfo: {
                ...prevState.patientInfo,
                email: email
            },
            suggestedProfiles: [],
            selectedProfileIndex: -1
        }), async () => {
            let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(email)) {
                try {
                    let res = await getPatientByEmail(email);
                    if (res && res.errCode === 0 && res.data && res.data.length > 0) {
                        this.setState({
                            suggestedProfiles: res.data,
                            selectedProfileIndex: 0
                        }, () => {
                            this.handleSelectProfile(0);
                        });
                    }
                } catch (error) {
                    console.error('Error fetching patient by email:', error);
                }
            }
        });
    }

    handleSelectProfile = (index) => {
        const { suggestedProfiles, patientInfo } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;

        if (index === -1) {
            this.setState({
                selectedProfileIndex: -1,
                patientInfo: {
                    ...patientInfo,
                    fullName: '',
                    phoneNumber: '',
                    address: '',
                    gender: '',
                    birthday: ''
                }
            });
            toast.info(isVi ? 
                'Vui lòng nhập thông tin mới cho người khám!' : 
                'Please enter new information for the patient!'
            );
        } else {
            let patient = suggestedProfiles[index];
            this.setState({
                selectedProfileIndex: index,
                patientInfo: {
                    ...patientInfo,
                    fullName: patient.fullName || '',
                    phoneNumber: patient.phoneNumber || '',
                    address: patient.address || '',
                    gender: patient.selectedGender || '',
                    birthday: patient.birthday ? moment(Number(patient.birthday)).format('YYYY-MM-DD') : ''
                }
            });
            toast.success(isVi ? 
                `Đã áp dụng hồ sơ: ${patient.fullName}` : 
                `Applied profile: ${patient.fullName}`
            );
        }
    }

    handleConfirmBooking = async () => {
        const { selectedDoctor, selectedDate, selectedTimeSlot, appointmentType, patientInfo } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;

        // Validate required fields
        if (!patientInfo.fullName || !patientInfo.phoneNumber || !patientInfo.email) {
            toast.error(isVi ? 'Vui lòng điền đầy đủ thông tin bắt buộc' : 'Please fill in all required fields');
            return;
        }

        // Validate email format
        let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientInfo.email)) {
            toast.error(isVi ? 'Định dạng email không hợp lệ!' : 'Invalid email format!');
            return;
        }

        // Validate phone number format
        let phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
        if (!phoneRegex.test(patientInfo.phoneNumber)) {
            toast.error(isVi ? 'Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 0 hoặc +84).' : 'Invalid phone number! Please enter a valid Vietnamese phone number.');
            return;
        }

        try {
            // Convert selectedDate to timestamp format
            let dateTimestamp = moment(selectedDate).startOf('day').valueOf();

            // Convert birthday to timestamp if provided
            let birthdayTimestamp = patientInfo.birthday ? new Date(patientInfo.birthday).getTime() : '';

            let timeDisplay = this.props.language === LANGUAGES.VI ?
                selectedTimeSlot.timeTypeData?.valueVi || '' : selectedTimeSlot.timeTypeData?.valueEn || '';
            
            let dateDisplay = this.props.language === LANGUAGES.VI ?
                moment(+dateTimestamp).locale('vi').format('dddd - DD/MM/YYYY') :
                moment(+dateTimestamp).locale('en').format('dddd - MM/DD/YYYY');

            let timeString = `${timeDisplay} - ${dateDisplay}`;

            let doctorName = selectedDoctor ? (this.props.language === LANGUAGES.VI ?
                `${selectedDoctor.lastName || ''} ${selectedDoctor.firstName || ''}` : `${selectedDoctor.firstName || ''} ${selectedDoctor.lastName || ''}`) : '';
            doctorName = doctorName.trim();

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
                toast.success(isVi ? 'Đặt lịch khám thành công!' : 'Appointment booked successfully!');
                setTimeout(() => {
                    this.props.history.push('/home');
                }, 1500);
            } else {
                toast.error(res.errMessage || (isVi ? 'Đặt lịch thất bại' : 'Booking failed'));
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            toast.error(isVi ? 'Đặt lịch thất bại' : 'Booking failed');
        }
    }

    renderStepIndicator = () => {
        const { currentStep } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;
        const steps = [
            { number: 1, label: isVi ? 'Chuyên khoa' : 'Specialty' },
            { number: 2, label: isVi ? 'Ngày giờ' : 'Date & Time' },
            { number: 3, label: isVi ? 'Thông tin' : 'Information' },
            { number: 4, label: isVi ? 'Xác nhận' : 'Confirmation' }
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
        const isVi = this.props.language === LANGUAGES.VI;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>{isVi ? 'Chọn chuyên khoa và bác sĩ' : 'Select Specialty and Doctor'}</h2>
                <div className='step-content'>
                    <div className='form-field'>
                        <label className='form-label'>
                            {isVi ? 'Cơ sở y tế (Phòng khám)' : 'Medical Facility (Clinic)'}
                        </label>
                        <select
                            className='form-select'
                            value={this.state.selectedClinicId}
                            onChange={(e) => this.handleClinicChange(e.target.value)}
                        >
                            <option value="">{isVi ? 'Tất cả cơ sở y tế' : 'All medical facilities'}</option>
                            {this.state.clinics && this.state.clinics.map(clinic => (
                                <option key={clinic.id} value={clinic.id}>
                                    {clinic.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>
                            {isVi ? 'Chuyên khoa' : 'Specialty'} <span className='required'>*</span>
                        </label>
                        <select
                            className='form-select'
                            value={selectedSpecialty}
                            onChange={(e) => this.handleSpecialtyChange(e.target.value)}
                        >
                            <option value="">{isVi ? 'Chọn chuyên khoa' : 'Select specialty'}</option>
                            {specialties.map(specialty => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>{isVi ? 'Chọn bác sĩ' : 'Select Doctor'}</label>
                        {filteredDoctors.length === 0 ? (
                            <div className='no-doctors-message'>
                                <i className='fa-regular fa-folder-open'></i>
                                <p>{isVi ? 'Không có bác sĩ nào phù hợp với bộ lọc hiện tại' : 'No doctors available for the current filters'}</p>
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
                                            checked={selectedDoctor ? selectedDoctor.id === doctor.id : false}
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
                                                <p className='doctor-name'>
                                                    {isVi ? `${doctor.lastName} ${doctor.firstName}` : `${doctor.firstName} ${doctor.lastName}`}
                                                </p>
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
                        {isVi ? 'Tiếp theo' : 'Next'}
                        <i className='fa-solid fa-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }

    renderStep2 = () => {
        const { selectedDate, selectedTime, appointmentType, availableTimeSlots, selectedDoctor } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>{isVi ? 'Chọn ngày và giờ khám' : 'Select Date and Time'}</h2>
                <div className='step-content'>
                    <div className='form-field'>
                        <label className='form-label'>
                            {isVi ? 'Ngày khám' : 'Appointment date'} <span className='required'>*</span>
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
                        <label className='form-label'>{isVi ? 'Khung giờ' : 'Time slot'}</label>
                        {!selectedDoctor ? (
                            <div className='no-time-message'>
                                <i className='fa-solid fa-user-doctor'></i>
                                <p>{isVi ? 'Vui lòng chọn bác sĩ ở bước 1 để xem khung giờ' : 'Please select a doctor in step 1 to view time slots'}</p>
                            </div>
                        ) : availableTimeSlots.length === 0 ? (
                            <div className='no-time-message'>
                                <i className='fa-regular fa-calendar-xmark'></i>
                                <p>{isVi ? 'Không có thông tin về lịch khám trong ngày này. Vui lòng chọn ngày khác!' : 'No schedule information available for this day. Please select another date!'}</p>
                            </div>
                        ) : (
                            <div className='time-grid'>
                                {availableTimeSlots.map((timeSlot, index) => {
                                    let timeDisplay = isVi ? (timeSlot.timeTypeData?.valueVi || '') : (timeSlot.timeTypeData?.valueEn || '');
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

                </div>
                <div className='step-actions'>
                    <button className='btn-secondary' onClick={this.prevStep}>
                        <i className='fa-solid fa-arrow-left'></i>
                        {isVi ? 'Quay lại' : 'Back'}
                    </button>
                    <button className='btn-primary' onClick={this.nextStep}>
                        {isVi ? 'Tiếp theo' : 'Next'}
                        <i className='fa-solid fa-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }

    renderStep3 = () => {
        const { patientInfo } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>{isVi ? 'Thông tin bệnh nhân' : 'Patient Information'}</h2>
                <div className='step-content'>
                    <div className='form-row'>
                        <div className='form-field'>
                            <label className='form-label'>
                                {isVi ? 'Họ và tên' : 'Full name'} <span className='required'>*</span>
                            </label>
                            <input
                                type='text'
                                className='form-input'
                                placeholder={isVi ? 'Nguyễn Văn A' : 'John Doe'}
                                value={patientInfo.fullName}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, fullName: e.target.value }
                                })}
                            />
                        </div>
                        <div className='form-field'>
                            <label className='form-label'>
                                {isVi ? 'Số điện thoại' : 'Phone number'} <span className='required'>*</span>
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
                                onChange={(e) => this.handleEmailChange(e)}
                            />
                        </div>
                        <div className='form-field'>
                            <label className='form-label'>{isVi ? 'Ngày sinh' : 'Date of birth'}</label>
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

                    {this.state.suggestedProfiles && this.state.suggestedProfiles.length > 0 && (
                        <div className='suggested-profiles-container'>
                            <p className='suggested-title'>
                                <i className="fa-solid fa-users-viewfinder"></i>{' '}
                                {isVi ? 'Chọn hồ sơ bệnh nhân đã lưu:' : 'Select saved patient profile:'}
                            </p>
                            <div className='suggested-grid'>
                                {this.state.suggestedProfiles.map((profile, idx) => (
                                    <div
                                        key={idx}
                                        className={`suggested-card ${this.state.selectedProfileIndex === idx ? 'active' : ''}`}
                                        onClick={() => this.handleSelectProfile(idx)}
                                    >
                                        <div className='card-header-info'>
                                            <span className='profile-name'>{profile.fullName}</span>
                                            {profile.selectedGender && (
                                                <span className='profile-gender-badge'>
                                                    {this.props.genders && this.props.genders.find(g => g.keyMap === profile.selectedGender)
                                                        ? (isVi ? this.props.genders.find(g => g.keyMap === profile.selectedGender).valueVi : this.props.genders.find(g => g.keyMap === profile.selectedGender).valueEn)
                                                        : profile.selectedGender}
                                                </span>
                                            )}
                                        </div>
                                        <div className='profile-details'>
                                            <p><i className="fa-solid fa-phone"></i> {profile.phoneNumber}</p>
                                            <p><i className="fa-solid fa-location-dot"></i> {profile.address}</p>
                                        </div>
                                    </div>
                                ))}
                                <div
                                    className={`suggested-card new-profile-card ${this.state.selectedProfileIndex === -1 ? 'active' : ''}`}
                                    onClick={() => this.handleSelectProfile(-1)}
                                >
                                    <div className='card-header-info'>
                                        <span className='profile-name'>{isVi ? 'Đặt cho người thân / Hồ sơ khác' : 'Book for relative / Other profile'}</span>
                                    </div>
                                    <div className='profile-details'>
                                        <p>{isVi ? 'Nhập thông tin mới của người khám' : 'Enter new information for the patient'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='form-row'>
                        <div className='form-field'>
                            <label className='form-label'>
                                {isVi ? 'Địa chỉ' : 'Address'} <span className='required'>*</span>
                            </label>
                            <input
                                type='text'
                                className='form-input'
                                placeholder={isVi ? 'Nhập địa chỉ liên hệ' : 'Enter contact address'}
                                value={patientInfo.address}
                                onChange={(e) => this.setState({
                                    patientInfo: { ...patientInfo, address: e.target.value }
                                })}
                            />
                        </div>
                    </div>

                    <div className='form-field'>
                        <label className='form-label'>{isVi ? 'Giới tính' : 'Gender'}</label>
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
                        <label className='form-label'>{isVi ? 'Triệu chứng / Lý do khám' : 'Symptoms / Reason for visit'}</label>
                        <textarea
                            className='form-input form-textarea'
                            rows='3'
                            placeholder={isVi ? 'Mô tả ngắn gọn tình trạng sức khỏe...' : 'Briefly describe your health condition...'}
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
                        {isVi ? 'Quay lại' : 'Back'}
                    </button>
                    <button className='btn-primary' onClick={this.nextStep}>
                        {isVi ? 'Tiếp theo' : 'Next'}
                        <i className='fa-solid fa-arrow-right'></i>
                    </button>
                </div>
            </div>
        );
    }

    renderStep4 = () => {
        const { selectedDoctor, selectedDate, selectedTime, selectedTimeSlot, appointmentType, patientInfo } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;

        return (
            <div className='booking-step'>
                <h2 className='step-title'>{isVi ? 'Xác nhận thông tin' : 'Confirm Information'}</h2>
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
                            <h3 className='doctor-name'>
                                {selectedDoctor && (isVi ? `${selectedDoctor.lastName} ${selectedDoctor.firstName}` : `${selectedDoctor.firstName} ${selectedDoctor.lastName}`)}
                            </h3>
                            <p className='doctor-specialty'>{selectedDoctor && this.getSpecialtyName(selectedDoctor)}</p>
                        </div>
                    </div>

                    <div className='review-details'>
                        <div className='detail-item'>
                            <i className='fa-regular fa-calendar'></i>
                            <div>
                                <p className='detail-label'>{isVi ? 'Ngày khám' : 'Appointment date'}</p>
                                <p className='detail-value'>
                                    {selectedDate ? moment(selectedDate).format('dddd, DD/MM/YYYY') : (isVi ? 'Chưa chọn' : 'Not selected')}
                                </p>
                            </div>
                        </div>
                        <div className='detail-item'>
                            <i className='fa-regular fa-clock'></i>
                            <div>
                                <p className='detail-label'>{isVi ? 'Giờ khám' : 'Appointment time'}</p>
                                <p className='detail-value'>
                                    {selectedTimeSlot 
                                        ? (isVi ? selectedTimeSlot.timeTypeData?.valueVi : selectedTimeSlot.timeTypeData?.valueEn) 
                                        : (selectedTime || (isVi ? 'Chưa chọn' : 'Not selected'))}
                                </p>
                            </div>
                        </div>

                        <div className='detail-item'>
                            <i className='fa-regular fa-user'></i>
                            <div>
                                <p className='detail-label'>{isVi ? 'Bệnh nhân' : 'Patient'}</p>
                                <p className='detail-value'>{patientInfo.fullName || (isVi ? 'Chưa nhập' : 'Not entered')}</p>
                            </div>
                        </div>
                    </div>

                    <div className='review-pricing'>
                        <div className='price-row'>
                            <span>{isVi ? 'Phí khám' : 'Examination fee'}</span>
                            <span>{selectedDoctor ? this.getDoctorPrice(selectedDoctor) : '350.000 VND'}</span>
                        </div>
                        <div className='price-row'>
                            <span>{isVi ? 'Phí đặt lịch' : 'Booking fee'}</span>
                            <span>{isVi ? 'Miễn phí' : 'Free'}</span>
                        </div>
                        <div className='price-row total'>
                            <span>{isVi ? 'Tổng cộng' : 'Total'}</span>
                            <span>{selectedDoctor ? this.getDoctorPrice(selectedDoctor) : '350.000 VND'}</span>
                        </div>
                    </div>
                </div>

                <div className='info-alert'>
                    <i className='fa-solid fa-circle-info'></i>
                    <p>
                        {isVi 
                            ? 'Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Lịch hẹn sẽ được gửi qua SMS và Email sau khi đặt thành công.' 
                            : 'Please double check your information before confirming. The appointment details will be sent via SMS and Email upon successful booking.'}
                    </p>
                </div>

                <div className='step-actions'>
                    <button className='btn-secondary' onClick={this.prevStep}>
                        <i className='fa-solid fa-arrow-left'></i>
                        {isVi ? 'Quay lại' : 'Back'}
                    </button>
                    <button className='btn-primary' onClick={this.handleConfirmBooking}>
                        <i className='fa-solid fa-check'></i>
                        {isVi ? 'Xác nhận đặt lịch' : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const { currentStep } = this.state;
        const isVi = this.props.language === LANGUAGES.VI;

        return (
            <Fragment>
                <HomeHeader />
                <main className='booking-flow-page'>
                    <div className='booking-container'>
                        <nav className='breadcrumb' aria-label='Breadcrumb'>
                            <a href='/home'>{isVi ? 'Trang chủ' : 'Home'}</a>
                            <i className='fa-solid fa-chevron-right'></i>
                            <span className='current'>{isVi ? 'Đặt lịch khám' : 'Book Appointment'}</span>
                        </nav>

                        <div className='page-header'>
                            <h1 className='page-title'>{isVi ? 'Đặt lịch khám' : 'Book Appointment'}</h1>
                            <p className='page-subtitle'>
                                {isVi 
                                    ? 'Hoàn thành 4 bước đơn giản để đặt lịch hẹn với bác sĩ.' 
                                    : 'Complete 4 simple steps to book an appointment with a doctor.'}
                            </p>
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
