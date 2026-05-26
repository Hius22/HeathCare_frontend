import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import HomeHeader from '../../HomePage/HomeHeader';
import HomeFooter from '../../HomePage/HomeFooter';
import { getAllDoctors, getAllSpecialty, getDetailInforDoctor } from '../../../services/userService';
import './AllDoctors.scss';

class AllDoctors extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            filteredDoctors: [],
            selectedSpecialty: 'all',
            searchQuery: '',
            isLoading: true
        };
    }

    async componentDidMount() {
        await this.loadDoctors();
        await this.loadSpecialties();
    }

    loadDoctors = async () => {
        this.setState({ isLoading: true });
        let res = await getAllDoctors();
        if (res && res.errCode === 0) {
            // Fetch detailed info for each doctor
            let doctorsWithDetails = await Promise.all(
                (res.data || []).map(async (doctor) => {
                    let detailRes = await getDetailInforDoctor(doctor.id);
                    if (detailRes && detailRes.errCode === 0 && detailRes.data) {
                        return {
                            ...doctor,
                            image: detailRes.data.image || doctor.image || '',
                            Doctor_Infor: detailRes.data.Doctor_Infor || null,
                            MarkDown: detailRes.data.MarkDown || null
                        };
                    }
                    return doctor;
                })
            );

            this.setState({
                doctors: doctorsWithDetails,
                filteredDoctors: doctorsWithDetails,
                isLoading: false
            });
        } else {
            this.setState({ isLoading: false });
        }
    }

    loadSpecialties = async () => {
        let res = await getAllSpecialty();
        if (res && res.errCode === 0) {
            this.setState({ specialties: res.data || [] });
        }
    }

    handleSpecialtyFilter = (specialtyId) => {
        const { doctors } = this.state;

        if (specialtyId === 'all') {
            this.setState({
                selectedSpecialty: 'all',
                filteredDoctors: doctors
            });
        } else {
            // Filter doctors by specialty
            let filtered = doctors.filter(doctor => {
                return doctor.Doctor_Infor && doctor.Doctor_Infor.specialtyId === specialtyId;
            });

            this.setState({
                selectedSpecialty: specialtyId,
                filteredDoctors: filtered
            });
        }
    }

    handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        const { doctors, selectedSpecialty } = this.state;

        let filtered = doctors;

        // Apply specialty filter first
        if (selectedSpecialty !== 'all') {
            filtered = filtered.filter(doctor => {
                return doctor.Doctor_Infor && doctor.Doctor_Infor.specialtyId === selectedSpecialty;
            });
        }

        // Apply search filter
        if (query) {
            filtered = filtered.filter(doctor => {
                const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
                const specialtyName = doctor.Doctor_Infor?.specialtyData?.name?.toLowerCase() || '';
                return fullName.includes(query) || specialtyName.includes(query);
            });
        }

        this.setState({
            searchQuery: query,
            filteredDoctors: filtered
        });
    }

    getSpecialtyName = (doctor) => {
        if (doctor && doctor.Doctor_Infor && doctor.Doctor_Infor.specialtyData) {
            return doctor.Doctor_Infor.specialtyData.name;
        }
        return 'Chưa cập nhật';
    }

    getDoctorPrice = (doctor) => {
        if (doctor && doctor.Doctor_Infor && doctor.Doctor_Infor.priceTypeData) {
            let price = doctor.Doctor_Infor.priceTypeData.valueVi;
            return Number(price).toLocaleString('vi-VN');
        }
        return 'Liên hệ';
    }

    handleViewProfile = (doctorId) => {
        this.props.history.push(`/detail-doctor/${doctorId}`);
    }

    handleBookAppointment = (doctorId) => {
        this.props.history.push(`/booking-flow`);
    }

    render() {
        const { filteredDoctors, specialties, selectedSpecialty, searchQuery, isLoading } = this.state;

        return (
            <React.Fragment>
                <HomeHeader isShowBanner={false} />

                <div className="all-doctors-container">
                    {/* Breadcrumb */}
                    <nav className="breadcrumb">
                        <a href="/home">Trang chủ</a>
                        <i className="fa-solid fa-chevron-right"></i>
                        <span className="current">Danh sách bác sĩ</span>
                    </nav>

                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">Danh sách bác sĩ</h1>
                        <p className="page-description">
                            Tìm kiếm bác sĩ chuyên khoa phù hợp với nhu cầu của bạn
                        </p>
                    </div>

                    {/* Mobile Filter + Search */}
                    <div className="mobile-filters">
                        <div className="mobile-search">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                placeholder="Tìm bác sĩ hoặc chuyên khoa"
                                value={searchQuery}
                                onChange={this.handleSearch}
                            />
                        </div>
                        <div className="specialty-chips">
                            <button
                                className={`chip ${selectedSpecialty === 'all' ? 'active' : ''}`}
                                onClick={() => this.handleSpecialtyFilter('all')}
                            >
                                Tất cả
                            </button>
                            {specialties.slice(0, 5).map((specialty, index) => (
                                <button
                                    key={index}
                                    className={`chip ${selectedSpecialty === specialty.id ? 'active' : ''}`}
                                    onClick={() => this.handleSpecialtyFilter(specialty.id)}
                                >
                                    {specialty.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="doctors-layout">
                        {/* Sidebar Filter (Desktop) */}
                        <aside className="sidebar-filter">
                            <div className="filter-card">
                                <h3 className="filter-title">Bộ lọc</h3>

                                {/* Search */}
                                <div className="filter-group">
                                    <label className="filter-label">Tìm bác sĩ</label>
                                    <div className="search-input-wrapper">
                                        <i className="fa-solid fa-magnifying-glass"></i>
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Tên hoặc chuyên khoa"
                                            value={searchQuery}
                                            onChange={this.handleSearch}
                                        />
                                    </div>
                                </div>

                                {/* Specialty Filter */}
                                <div className="filter-group">
                                    <label className="filter-label">Chuyên khoa</label>
                                    <select
                                        className="filter-select"
                                        value={selectedSpecialty}
                                        onChange={(e) => this.handleSpecialtyFilter(e.target.value)}
                                    >
                                        <option value="all">Tất cả chuyên khoa</option>
                                        {specialties.map((specialty, index) => (
                                            <option key={index} value={specialty.id}>
                                                {specialty.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Results Count */}
                                <div className="results-count">
                                    Hiển thị <span>{filteredDoctors.length}</span> bác sĩ
                                </div>
                            </div>
                        </aside>

                        {/* Doctor Listing */}
                        <section className="doctors-listing">
                            {isLoading ? (
                                <div className="loading-state">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Đang tải danh sách bác sĩ...</p>
                                </div>
                            ) : filteredDoctors.length > 0 ? (
                                <div className="doctors-list">
                                    {filteredDoctors.map((doctor, index) => (
                                        <div className="doctor-card" key={index}>
                                            <div className="doctor-image">
                                                {doctor.image ? (
                                                    <img src={doctor.image} alt={`BS. ${doctor.firstName}`} />
                                                ) : (
                                                    <div className="doctor-avatar-placeholder">
                                                        <i className="fa-solid fa-user-doctor"></i>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="doctor-content">
                                                <div className="doctor-info">
                                                    <div className="info-header">
                                                        <div>
                                                            <h2 className="doctor-name">
                                                                {doctor.positionData?.valueVi || 'Bác sĩ'} {doctor.firstName} {doctor.lastName}
                                                            </h2>
                                                            <div className="doctor-tags">
                                                                <span className="specialty-tag">
                                                                    {this.getSpecialtyName(doctor)}
                                                                </span>
                                                                {doctor.Doctor_Infor?.clinicData && (
                                                                    <span className="clinic-tag">
                                                                        <i className="fa-solid fa-hospital"></i>
                                                                        {doctor.Doctor_Infor.clinicData.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="doctor-details">
                                                        <div className="detail-item">
                                                            <span className="detail-label">Giá khám</span>
                                                            <span className="detail-value price">
                                                                {this.getDoctorPrice(doctor)}đ
                                                            </span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span className="detail-label">Kinh nghiệm</span>
                                                            <span className="detail-value">
                                                                {doctor.Doctor_Infor?.experienceYears || '10+'} năm
                                                            </span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span className="detail-label">Ngôn ngữ</span>
                                                            <span className="detail-value">
                                                                Tiếng Việt, Anh
                                                            </span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span className="detail-label">Lịch khám gần nhất</span>
                                                            <span className="detail-value available">
                                                                Hôm nay
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="doctor-actions">
                                                    <button
                                                        className="btn-view-profile"
                                                        onClick={() => this.handleViewProfile(doctor.id)}
                                                    >
                                                        Xem hồ sơ
                                                    </button>
                                                    <button
                                                        className="btn-book-now"
                                                        onClick={() => this.handleBookAppointment(doctor.id)}
                                                    >
                                                        Đặt lịch
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">
                                        <i className="fa-solid fa-user-doctor"></i>
                                    </div>
                                    <h3 className="empty-title">Không tìm thấy bác sĩ</h3>
                                    <p className="empty-description">
                                        Không có bác sĩ nào phù hợp với bộ lọc của bạn. Vui lòng thử lại với bộ lọc khác.
                                    </p>
                                    <button
                                        className="btn-reset"
                                        onClick={() => {
                                            this.setState({
                                                selectedSpecialty: 'all',
                                                searchQuery: '',
                                                filteredDoctors: this.state.doctors
                                            });
                                        }}
                                    >
                                        Đặt lại bộ lọc
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                <HomeFooter />
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state) => ({
    language: state.app.language
});

export default withRouter(connect(mapStateToProps)(AllDoctors));
