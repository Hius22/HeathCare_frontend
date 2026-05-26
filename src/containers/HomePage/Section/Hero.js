import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import { getAllSpecialty, getAllDoctors, getDoctorsBySpecialty } from '../../../services/userService';
import { LANGUAGES } from '../../../utils';
import './Hero.scss';

class Hero extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // form values
            specialtyId: '',
            doctorId: '',
            date: '',
            // data from API
            listSpecialty: [],
            listDoctor: [],
            listDoctorFiltered: [],
            // UI state
            isLoadingDoctors: false,
            isSubmitting: false,
        }
    }

    async componentDidMount() {
        try {
            const [resSpecialty, resDoctor] = await Promise.all([
                getAllSpecialty(),
                getAllDoctors()
            ]);

            let listSpecialty = resSpecialty?.errCode === 0 ? (resSpecialty.data || []) : [];
            let listDoctor = resDoctor?.errCode === 0 ? (resDoctor.data || []) : [];

            this.setState({ listSpecialty, listDoctor, listDoctorFiltered: listDoctor });
        } catch (err) {
            // silent fail — form still usable
        }
    }

    // When specialty changes → fetch doctors for that specialty from API
    handleSpecialtyChange = async (e) => {
        const specialtyId = e.target.value;
        this.setState({ specialtyId, doctorId: '', listDoctorFiltered: [] });

        if (!specialtyId) {
            // Reset to all doctors
            this.setState({ listDoctorFiltered: this.state.listDoctor });
            return;
        }

        try {
            let res = await getDoctorsBySpecialty(specialtyId);
            this.setState({
                listDoctorFiltered: res && res.errCode === 0 ? (res.data || []) : []
            });
        } catch (err) {
            this.setState({ listDoctorFiltered: [] });
        }
    }

    handleDoctorChange = (e) => {
        this.setState({ doctorId: e.target.value });
    }

    handleDateChange = (e) => {
        this.setState({ date: e.target.value });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const { specialtyId, doctorId, date } = this.state;

        // Build query params and go to BookingFlow
        const params = new URLSearchParams();
        if (specialtyId) params.set('specialtyId', specialtyId);
        if (doctorId)    params.set('doctorId', doctorId);
        if (date)        params.set('date', date);

        const query = params.toString();
        this.props.history.push(`/booking-flow${query ? `?${query}` : ''}`);
    }

    getDoctorName = (doctor) => {
        const { language } = this.props;
        const pos = doctor.positionData;
        if (language === LANGUAGES.VI) {
            return `${pos?.valueVi ? pos.valueVi + ', ' : ''}${doctor.lastName} ${doctor.firstName}`;
        }
        return `${pos?.valueEn ? pos.valueEn + ', ' : ''}${doctor.firstName} ${doctor.lastName}`;
    }

    // Get specialty names from doctorSpecialties array (new M-N structure)
    getDoctorSpecialtyNames = (doctor) => {
        if (doctor.doctorSpecialties && doctor.doctorSpecialties.length > 0) {
            return doctor.doctorSpecialties
                .map(ds => ds.specialtyData?.name)
                .filter(Boolean)
                .join(', ');
        }
        return '';
    }

    render() {
        const { language } = this.props;
        const isVi = language === LANGUAGES.VI;
        const {
            specialtyId, doctorId, date,
            listSpecialty, listDoctorFiltered
        } = this.state;

        // min date = today
        const today = new Date().toISOString().split('T')[0];

        return (
            <section className="hero-section">
                {/* Decorative blobs */}
                <div className="hero-blob hero-blob--1" />
                <div className="hero-blob hero-blob--2" />

                <div className="hero-container">
                    <div className="hero-grid">

                        {/* ── Left: headline ── */}
                        <div className="hero-content">
                            <div className="hero-badge">
                                <i className="fas fa-shield-alt"></i>
                                {isVi ? 'Nền tảng y tế tin cậy' : 'Trusted Healthcare Platform'}
                            </div>
                            <h1 className="hero-title">
                                {isVi
                                    ? 'Đặt lịch khám bệnh nhanh chóng – Không cần chờ đợi'
                                    : 'Fast Medical Appointment – No Waiting'}
                            </h1>
                            <p className="hero-description">
                                {isVi
                                    ? 'Chọn bác sĩ, chọn giờ khám phù hợp chỉ trong 30 giây. Trải nghiệm dịch vụ chăm sóc sức khỏe hiện đại và chuyên nghiệp.'
                                    : 'Choose a doctor and a suitable appointment time in just 30 seconds. Experience modern, professional healthcare.'}
                            </p>

                            <div className="hero-features">
                                <div className="feature-item">
                                    <span className="feature-icon"><i className="fas fa-user-md"></i></span>
                                    <span className="feature-text">{isVi ? 'Bác sĩ chuyên khoa' : 'Specialist Doctors'}</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon"><i className="fas fa-clock"></i></span>
                                    <span className="feature-text">{isVi ? 'Tiết kiệm thời gian' : 'Save Time'}</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon"><i className="fas fa-envelope-open-text"></i></span>
                                    <span className="feature-text">{isVi ? 'Xác nhận qua email' : 'Email Confirmation'}</span>
                                </div>
                            </div>

                            <div className="hero-stats">
                                <div className="stat">
                                    <span className="stat-num">50+</span>
                                    <span className="stat-lbl">{isVi ? 'Bác sĩ' : 'Doctors'}</span>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat">
                                    <span className="stat-num">10K+</span>
                                    <span className="stat-lbl">{isVi ? 'Bệnh nhân' : 'Patients'}</span>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat">
                                    <span className="stat-num">4.9★</span>
                                    <span className="stat-lbl">{isVi ? 'Đánh giá' : 'Rating'}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Right: search form ── */}
                        <div className="hero-form-card">
                            <div className="form-card-header">
                                <i className="fas fa-calendar-plus"></i>
                                <h3 className="form-title">
                                    {isVi ? 'Tìm lịch khám' : 'Find Appointment'}
                                </h3>
                            </div>

                            <form className="booking-form" onSubmit={this.handleSubmit}>

                                {/* Specialty */}
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="fas fa-stethoscope"></i>
                                        {isVi ? 'Chuyên khoa' : 'Specialty'}
                                    </label>
                                    <select
                                        className="form-input"
                                        value={specialtyId}
                                        onChange={this.handleSpecialtyChange}
                                    >
                                        <option value="">
                                            {isVi ? '— Tất cả chuyên khoa —' : '— All specialties —'}
                                        </option>
                                        {listSpecialty.map(sp => (
                                            <option key={sp.id} value={sp.id}>
                                                {sp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Doctor */}
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="fas fa-user-md"></i>
                                        {isVi ? 'Bác sĩ' : 'Doctor'}
                                    </label>
                                    <select
                                        className="form-input"
                                        value={doctorId}
                                        onChange={this.handleDoctorChange}
                                        disabled={listDoctorFiltered.length === 0}
                                    >
                                        <option value="">
                                            {listDoctorFiltered.length === 0
                                                ? (isVi ? 'Không có bác sĩ phù hợp' : 'No doctors available')
                                                : (isVi ? '— Tất cả bác sĩ —' : '— All doctors —')}
                                        </option>
                                        {listDoctorFiltered.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {this.getDoctorName(d)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="fas fa-calendar-alt"></i>
                                        {isVi ? 'Ngày khám' : 'Appointment Date'}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={date}
                                        min={today}
                                        onChange={this.handleDateChange}
                                    />
                                </div>

                                <button type="submit" className="submit-btn">
                                    <i className="fas fa-search"></i>
                                    {isVi ? 'Tìm lịch khám' : 'Search Appointments'}
                                </button>

                                <p className="form-note">
                                    <i className="fas fa-info-circle"></i>
                                    {isVi
                                        ? 'Xác nhận lịch hẹn qua email ngay lập tức'
                                        : 'Appointment confirmed via email instantly'}
                                </p>
                            </form>
                        </div>

                    </div>
                </div>
            </section>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: state.user.isLoggedIn,
    language: state.app.language,
});

export default withRouter(connect(mapStateToProps)(Hero));
