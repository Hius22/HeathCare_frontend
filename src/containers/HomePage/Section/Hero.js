import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import { getAllSpecialty, getAllDoctors, getDoctorsBySpecialty, getAllClinic } from '../../../services/userService';
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
            listClinic: [],
            // UI state
            isLoadingDoctors: false,
            isSubmitting: false,

            // Unified search state
            activeTab: 'schedule', // 'schedule' or 'search'
            searchKeyword: '',
            isSearchFocused: false,
            filteredSpecialties: [],
            filteredDoctors: [],
            filteredClinics: []
        }
    }

    async componentDidMount() {
        try {
            const [resSpecialty, resDoctor, resClinic] = await Promise.all([
                getAllSpecialty(),
                getAllDoctors(),
                getAllClinic()
            ]);

            let listSpecialty = resSpecialty?.errCode === 0 ? (resSpecialty.data || []) : [];
            let listDoctor = resDoctor?.errCode === 0 ? (resDoctor.data || []) : [];
            let listClinic = resClinic?.errCode === 0 ? (resClinic.data || []) : [];

            this.setState({ 
                listSpecialty, 
                listDoctor, 
                listDoctorFiltered: listDoctor,
                listClinic 
            });
        } catch (err) {
            // silent fail — form still usable
        }
    }

    handleSearchInputChange = (e) => {
        const query = e.target.value;
        const queryLower = query.toLowerCase().trim();
        const { listSpecialty, listDoctor, listClinic } = this.state;

        if (!queryLower) {
            this.setState({
                searchKeyword: query,
                filteredSpecialties: [],
                filteredDoctors: [],
                filteredClinics: []
            });
            return;
        }

        // Filter Specialties
        const filteredSpecialties = listSpecialty.filter(item => 
            item.name && item.name.toLowerCase().includes(queryLower)
        );

        // Filter Clinics
        const filteredClinics = listClinic.filter(item => 
            (item.name && item.name.toLowerCase().includes(queryLower)) ||
            (item.address && item.address.toLowerCase().includes(queryLower))
        );

        // Filter Doctors
        const filteredDoctors = listDoctor.filter(item => {
            const fullNameVi = `${item.lastName || ''} ${item.firstName || ''}`.toLowerCase();
            const fullNameEn = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
            const position = item.positionData?.valueVi?.toLowerCase() || '';
            const specialtyNames = this.getDoctorSpecialtyNames(item).toLowerCase();
            return fullNameVi.includes(queryLower) || fullNameEn.includes(queryLower) || position.includes(queryLower) || specialtyNames.includes(queryLower);
        });

        this.setState({
            searchKeyword: query,
            filteredSpecialties,
            filteredClinics,
            filteredDoctors
        });
    }

    handleClearSearch = () => {
        this.setState({
            searchKeyword: '',
            filteredSpecialties: [],
            filteredClinics: [],
            filteredDoctors: []
        });
    }

    handleSearchSubmit = (e) => {
        e.preventDefault();
        const { searchKeyword } = this.state;
        if (searchKeyword.trim()) {
            this.props.history.push(`/doctors?search=${encodeURIComponent(searchKeyword.trim())}`);
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
        let list = [];
        if (doctor.doctorSpecialties && doctor.doctorSpecialties.length > 0) {
            doctor.doctorSpecialties.forEach(ds => {
                if (ds.specialtyData && ds.specialtyData.name) {
                    list.push(ds.specialtyData.name);
                }
            });
        }
        if (list.length === 0 && doctor.Doctor_Infor && doctor.Doctor_Infor.specialtyData) {
            list.push(doctor.Doctor_Infor.specialtyData.name);
        }
        return list.filter(Boolean).join(', ');
    }

    render() {
        const { language } = this.props;
        const isVi = language === LANGUAGES.VI;
        const {
            specialtyId, doctorId, date,
            listSpecialty, listDoctorFiltered,
            activeTab, searchKeyword, isSearchFocused,
            filteredSpecialties, filteredClinics, filteredDoctors
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
                            <div className="card-tabs">
                                <button 
                                    type="button"
                                    className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                                    onClick={() => this.setState({ activeTab: 'schedule' })}
                                >
                                    <i className="fas fa-calendar-plus"></i>
                                    {isVi ? 'Đặt lịch khám' : 'Find Appointment'}
                                </button>
                                <button 
                                    type="button"
                                    className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                                    onClick={() => this.setState({ activeTab: 'search' })}
                                >
                                    <i className="fas fa-search"></i>
                                    {isVi ? 'Tìm nhanh' : 'Quick Search'}
                                </button>
                            </div>

                            {activeTab === 'schedule' ? (
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
                            ) : (
                                <form className="booking-form" onSubmit={this.handleSearchSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <i className="fa-solid fa-magnifying-glass"></i>
                                            {isVi ? 'Nhập từ khóa tìm kiếm' : 'Search keyword'}
                                        </label>
                                        <div className="unified-search-wrapper" style={{ position: 'relative' }}>
                                            <input 
                                                type="text"
                                                className="form-input"
                                                placeholder={isVi ? "Bác sĩ, chuyên khoa, phòng khám..." : "Doctor, specialty, clinic..."}
                                                value={searchKeyword}
                                                onChange={this.handleSearchInputChange}
                                                onFocus={() => this.setState({ isSearchFocused: true })}
                                                onBlur={() => setTimeout(() => this.setState({ isSearchFocused: false }), 200)}
                                            />
                                            {searchKeyword && (
                                                <button type="button" className="clear-search-btn" onClick={this.handleClearSearch}>
                                                    <i className="fa-solid fa-xmark"></i>
                                                </button>
                                            )}

                                            {/* Suggestions Dropdown */}
                                            {isSearchFocused && (filteredSpecialties.length > 0 || filteredDoctors.length > 0 || filteredClinics.length > 0) && (
                                                <div className="search-suggestions-dropdown">
                                                    {filteredSpecialties.length > 0 && (
                                                        <div className="suggestion-section specialty-section">
                                                            <div className="section-title">
                                                                <i className="fa-solid fa-stethoscope"></i>
                                                                {isVi ? 'Chuyên khoa' : 'Specialties'}
                                                            </div>
                                                            <div className="section-items">
                                                                {filteredSpecialties.slice(0, 3).map(item => (
                                                                    <div 
                                                                        key={`spec-${item.id}`} 
                                                                        className="suggestion-item"
                                                                        onMouseDown={() => this.props.history.push(`/detail-specialty/${item.id}`)}
                                                                    >
                                                                        <div className="item-row">
                                                                            <span className="item-name">{item.name}</span>
                                                                            <span className="item-tag tag-specialty">{isVi ? 'Chuyên khoa' : 'Specialty'}</span>
                                                                        </div>
                                                                        <span className="item-sub">
                                                                            <i className="fa-solid fa-stethoscope" style={{ marginRight: '4px', color: '#94a3b8' }}></i>
                                                                            {isVi ? 'Danh sách bác sĩ và lịch khám chuyên khoa' : 'Specialty doctors and schedules'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {filteredClinics.length > 0 && (
                                                        <div className="suggestion-section clinic-section">
                                                            <div className="section-title">
                                                                <i className="fa-solid fa-hospital"></i>
                                                                {isVi ? 'Cơ sở y tế' : 'Clinics'}
                                                            </div>
                                                            <div className="section-items">
                                                                {filteredClinics.slice(0, 3).map(item => (
                                                                    <div 
                                                                        key={`clinic-${item.id}`} 
                                                                        className="suggestion-item"
                                                                        onMouseDown={() => this.props.history.push(`/detail-clinic/${item.id}`)}
                                                                    >
                                                                        <div className="item-row">
                                                                            <span className="item-name">{item.name}</span>
                                                                            <span className="item-tag tag-clinic">{isVi ? 'Cơ sở y tế' : 'Clinic'}</span>
                                                                        </div>
                                                                        <span className="item-sub">
                                                                            <i className="fa-solid fa-location-dot" style={{ marginRight: '4px', color: '#94a3b8' }}></i>
                                                                            {item.address}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {filteredDoctors.length > 0 && (
                                                        <div className="suggestion-section doctor-section">
                                                            <div className="section-title">
                                                                <i className="fa-solid fa-user-md"></i>
                                                                {isVi ? 'Bác sĩ' : 'Doctors'}
                                                            </div>
                                                            <div className="section-items">
                                                                {filteredDoctors.slice(0, 3).map(item => (
                                                                    <div 
                                                                        key={`doc-${item.id}`} 
                                                                        className="suggestion-item"
                                                                        onMouseDown={() => this.props.history.push(`/detail-doctor/${item.id}`)}
                                                                    >
                                                                        <div className="item-row">
                                                                            <span className="item-name">
                                                                                {isVi 
                                                                                    ? `${item.positionData?.valueVi || 'Bác sĩ'} ${item.lastName || ''} ${item.firstName || ''}`
                                                                                    : `${item.positionData?.valueEn || 'Doctor'} ${item.firstName || ''} ${item.lastName || ''}`
                                                                                }
                                                                            </span>
                                                                            <span className="item-tag tag-doctor">{isVi ? 'Bác sĩ' : 'Doctor'}</span>
                                                                        </div>
                                                                        {this.getDoctorSpecialtyNames(item) && (
                                                                            <span className="item-sub">
                                                                                <i className="fa-solid fa-stethoscope" style={{ marginRight: '4px', color: '#94a3b8' }}></i>
                                                                                {this.getDoctorSpecialtyNames(item)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isSearchFocused && searchKeyword && filteredSpecialties.length === 0 && filteredDoctors.length === 0 && filteredClinics.length === 0 && (
                                                <div className="search-suggestions-dropdown empty">
                                                    {isVi ? 'Không tìm thấy kết quả' : 'No results found'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button type="submit" className="submit-btn" style={{ marginTop: '16px' }}>
                                        <i className="fas fa-search"></i>
                                        {isVi ? 'Tìm kiếm' : 'Search'}
                                    </button>

                                    <div className="search-shortcuts" style={{ marginTop: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <span style={{ color: '#475569', fontWeight: 600 }}>{isVi ? 'Xem danh sách:' : 'Browse lists:'}</span>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <a href="/doctors" onClick={(e) => { e.preventDefault(); this.props.history.push('/doctors'); }} style={{ color: '#006ea8', textDecoration: 'none', fontWeight: 500 }}>
                                                {isVi ? '🩺 Bác sĩ' : '🩺 Doctors'}
                                            </a>
                                            <a href="/facilities" onClick={(e) => { e.preventDefault(); this.props.history.push('/facilities'); }} style={{ color: '#006ea8', textDecoration: 'none', fontWeight: 500 }}>
                                                {isVi ? '🏥 Phòng khám' : '🏥 Clinics'}
                                            </a>
                                            <a href="/all-specialty" onClick={(e) => { e.preventDefault(); this.props.history.push('/all-specialty'); }} style={{ color: '#006ea8', textDecoration: 'none', fontWeight: 500 }}>
                                                {isVi ? '🔬 Chuyên khoa' : '🔬 Specialties'}
                                            </a>
                                        </div>
                                    </div>
                                </form>
                            )}
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
