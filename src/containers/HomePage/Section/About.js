import React, { Component } from "react";
import { connect } from "react-redux";
import { LANGUAGES } from '../../../utils';
import './About.scss';

class About extends Component {
    render() {
        const { language } = this.props;
        const isVi = language === LANGUAGES.VI;

        const stats = [
            { icon: 'fas fa-user-md', value: '50+', labelVi: 'Bác sĩ chuyên khoa', labelEn: 'Specialist Doctors' },
            { icon: 'fas fa-calendar-check', value: '10,000+', labelVi: 'Lượt khám mỗi năm', labelEn: 'Appointments/Year' },
            { icon: 'fas fa-star', value: '4.9/5', labelVi: 'Đánh giá hài lòng', labelEn: 'Satisfaction Rating' },
            { icon: 'fas fa-hospital', value: '15+', labelVi: 'Chuyên khoa', labelEn: 'Specialties' },
        ];

        const features = [
            {
                icon: 'fas fa-shield-alt',
                titleVi: 'Đội ngũ uy tín',
                titleEn: 'Trusted Team',
                descVi: 'Tất cả bác sĩ đều có chứng chỉ hành nghề và kinh nghiệm lâu năm trong lĩnh vực chuyên môn.',
                descEn: 'All doctors are licensed and experienced professionals in their respective fields.'
            },
            {
                icon: 'fas fa-clock',
                titleVi: 'Đặt lịch nhanh chóng',
                titleEn: 'Quick Booking',
                descVi: 'Đặt lịch khám online 24/7, xác nhận qua email ngay lập tức, không cần chờ đợi.',
                descEn: 'Book online 24/7, instant email confirmation, no waiting required.'
            },
            {
                icon: 'fas fa-comments',
                titleVi: 'Tư vấn trực tuyến',
                titleEn: 'Online Consultation',
                descVi: 'Kết nối trực tiếp với bác sĩ qua hình thức tư vấn trực tuyến tiện lợi, tiết kiệm thời gian.',
                descEn: 'Connect directly with doctors via convenient online consultation, saving your time.'
            },
        ];

        return (
            <div className="about-section">
                {/* Stats Row */}
                <div className="about-stats">
                    <div className="stats-inner">
                        {stats.map((stat, i) => (
                            <div className="stat-item" key={i}>
                                <div className="stat-icon">
                                    <i className={stat.icon}></i>
                                </div>
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{isVi ? stat.labelVi : stat.labelEn}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* About Content */}
                <div className="about-content">
                    <div className="about-left">
                        <div className="section-tag">
                            <i className="fas fa-heartbeat"></i>
                            {isVi ? 'Về chúng tôi' : 'About Us'}
                        </div>
                        <h2 className="about-title">
                            {isVi
                                ? 'Chăm sóc sức khỏe toàn diện — Đặt lịch dễ dàng'
                                : 'Comprehensive Healthcare — Easy Scheduling'}
                        </h2>
                        <p className="about-desc">
                            {isVi
                                ? 'Chúng tôi kết nối bệnh nhân với các bác sĩ chuyên khoa hàng đầu, mang lại trải nghiệm đặt lịch khám đơn giản, nhanh chóng và đáng tin cậy. Hệ thống hoạt động 24/7 giúp bạn chủ động quản lý sức khỏe.'
                                : 'We connect patients with top specialist doctors, delivering a simple, fast, and reliable appointment booking experience. Our 24/7 system helps you proactively manage your health.'}
                        </p>
                        <div className="about-features">
                            {features.map((f, i) => (
                                <div className="feature-item" key={i}>
                                    <div className="feature-icon">
                                        <i className={f.icon}></i>
                                    </div>
                                    <div className="feature-text">
                                        <strong>{isVi ? f.titleVi : f.titleEn}</strong>
                                        <p>{isVi ? f.descVi : f.descEn}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="about-right">
                        <div className="about-video">
                            <iframe
                                src="https://www.youtube.com/embed/FyDQljKtWnI"
                                title="Healthcare System Introduction"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="about-badge">
                            <i className="fas fa-award"></i>
                            <span>{isVi ? 'Được tin dùng bởi hàng nghìn bệnh nhân' : 'Trusted by thousands of patients'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    language: state.app.language,
});

export default connect(mapStateToProps)(About);
