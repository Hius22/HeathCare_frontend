import axios from "../axios"

const handleLoginApi = (userEmail, userPassword) => {
    return axios.post('/api/login', { email: userEmail, password: userPassword });
}

const getAllUsers = (inputId) => {
    //template string
    return axios.get(`/api/get-all-users?id=${inputId}`, { id: inputId });
}

const createNewUserService = (data) => {
    return axios.post('/api/create-new-user', data)
}

const deleteUserService = (userId) => {
    return axios.delete('/api/delete-user', {
        data: {
            id: userId
        }
    });
}

const editUserService = (inputData) => {
    return axios.put('/api/edit-user', inputData);
}

const getALLCodeService = (inputType) => {
    return axios.get(`/api/allcode?type=${inputType}`);
}

const getTopDoctorHomeService = (limit) => {
    return axios.get(`/api/top-doctor-home?limit=${limit}`);
}

const getAllDoctors = () => {
    return axios.get(`/api/get-all-doctors`);
}

const getDoctorsBySpecialty = (specialtyId) => {
    return axios.get(`/api/get-doctors-by-specialty?specialtyId=${specialtyId}`);
}

const saveDetailDoctorService = (data) => {
    return axios.post('/api/save-infor-doctors', data)
}

const getDetailInforDoctor = (inputId) => {
    return axios.get(`/api/get-detail-doctor-by-id?id=${inputId}`)
}

const saveBulkScheduleDoctor = (data) => {
    return axios.post('/api/bulk-create-schedule', data)
}

const getScheduleDoctorByDate = (doctorId, date) => {
    return axios.get(`/api/get-schedule-doctor-by-date?doctorId=${doctorId}&date=${date}`)
}

const getExtraInforDoctorById = (doctorId) => {
    return axios.get(`/api/get-extra-infor-doctor-by-id?doctorId=${doctorId}`)
}

const getProfileDoctorById = (doctorId) => {
    return axios.get(`/api/get-profile-doctor-by-id?doctorId=${doctorId}`)
}

const postPatientBookingAppointment = (data) => {
    return axios.post('/api/patient-book-appointment', data)
}

const postVerifyBookingAppointment = (data) => {
    return axios.post('/api/verify-book-appointment', data)
}

const createNewSpecialty = (data) => {
    return axios.post('/api/create-new-specialty', data)
}

const getAllSpecialty = () => {
    return axios.get(`/api/get-specialty`)
}

const getDetailSpecialtyById = (data) => {
    return axios.get(`/api/get-detail-specialty-by-id?id=${data.id}&location=${data.location}`)
}

const updateSpecialty = (data) => {
    return axios.put('/api/update-specialty', data)
}

const deleteSpecialty = (data) => {
    return axios.delete('/api/delete-specialty', {
        data: { id: data.id }
    })
}

const getAllBookings = (data) => {
    let url = `/api/get-all-bookings?date=${data.date || ''}`;
    if (data.patientId) {
        url += `&patientId=${data.patientId}`;
    }
    if (data.patientEmail) {
        url += `&patientEmail=${encodeURIComponent(data.patientEmail)}`;
    }
    return axios.get(url);
}

const updateBookingStatus = (data) => {
    return axios.put('/api/update-booking-status', data)
}

const getAllClinic = () => {
    return axios.get(`/api/get-clinic`)
}

const getDetailClinicById = (data) => {
    return axios.get(`/api/get-detail-clinic-by-id?id=${data.id}`)
}

const getClinicInfo = () => {
    return axios.get('/api/get-clinic-info')
}

const createClinicInfo = (data) => {
    return axios.post('/api/create-clinic-info', data)
}

const updateClinicInfo = (data) => {
    return axios.put('/api/update-clinic-info', data)
}

const getAllPatientForDoctor = (data) => {
    return axios.get(`/api/get-list-patient-for-doctor?doctorId=${data.doctorId}&date=${data.date}`)
}

const postSendRemedy = (data) => {
    return axios.post('/api/send-remedy', data)
}

const postCancelBooking = (data) => {
    return axios.post('/api/cancel-booking', data)
}

const deleteScheduleDoctor = (scheduleId) => {
    return axios.delete(`/api/delete-schedule-doctor?id=${scheduleId}`);
}

const getAllScheduleDoctor = () => {
    return axios.get('/api/get-all-schedule');
}

const getPatientHistory = (patientId) => {
    return axios.get(`/api/get-patient-history?patientId=${patientId}`);
}

const savePatientHistory = (data) => {
    return axios.post('/api/save-patient-history', data);
}

export {
    handleLoginApi, getAllUsers, createNewUserService,
    deleteUserService, editUserService, getALLCodeService,
    getTopDoctorHomeService, getAllDoctors, getDoctorsBySpecialty, saveDetailDoctorService,
    getDetailInforDoctor, saveBulkScheduleDoctor, getScheduleDoctorByDate,
    getExtraInforDoctorById, getProfileDoctorById, postPatientBookingAppointment,
    postVerifyBookingAppointment, createNewSpecialty, getAllSpecialty,
    getDetailSpecialtyById, getAllClinic,
    getDetailClinicById, getClinicInfo, createClinicInfo, updateClinicInfo,
    getAllPatientForDoctor, postSendRemedy,
    postCancelBooking, deleteScheduleDoctor, getAllScheduleDoctor,
    updateSpecialty, deleteSpecialty,
    getAllBookings, updateBookingStatus,
    getPatientHistory, savePatientHistory
}
