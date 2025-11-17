import React, { Component } from "react";
import { connect } from "react-redux";    // CSS từ HomePage
import "./HomeBody.scss";    // CSS riêng HomeBody nếu cần

const QUICK_LINKS = [
    {
        id: "treatments",
        label: "Bệnh điều trị",
        title: "Phác đồ cá nhân hóa",
        desc: "Chủ động theo dõi tim mạch, ung bướu, sản phụ khoa cùng chuyên gia.",
    },
    {
        id: "technology",
        label: "Công nghệ",
        title: "Phòng mổ hybrid & AI",
        desc: "Ứng dụng robot, AI chẩn đoán và HealthCare+ Cloud.",
    },
    {
        id: "testimonials",
        label: "Khách hàng",
        title: "18.000+ hành trình hồi phục",
        desc: "Nghe câu chuyện thực tế từ gia đình HealthCare+.",
    },
];

const STATS = [
    { value: "28+", label: "Chuyên khoa mũi nhọn" },
    { value: "180", label: "Bác sĩ đầu ngành" },
    { value: "95%", label: "Bệnh nhân hài lòng" },
    { value: "24/7", label: "Support + AI" },
];

const SPECIALTIES = [
    "Tim mạch",
    "Thần kinh",
    "Nhi khoa",
    "Ung bướu",
    "Sản phụ khoa",
    "Phục hồi chức năng",
];

class HomeBody extends Component {
    handleNavigate = (screen) => {
        console.log("Đi đến:", screen);
        // Nếu bạn có router thì điều hướng tại đây
        // this.props.history.push(...)
    };

    render() {
        return (
            <div className="home-page">
                {/* ===================== HERO ====================== */}
                <section className="home-hero">
                    <div className="home-hero__content">
                        <p className="home-hero__eyebrow">Trung tâm chăm sóc chủ động</p>
                        <h1>
                            Đặt lịch, quản lý hồ sơ, trò chuyện bác sĩ chỉ trên một nền tảng.
                        </h1>
                        <p>
                            HealthCare+ kết hợp đội ngũ chuyên gia, công nghệ AI và hồ sơ số
                            chuẩn HL7. Bạn nhận nhắc thuốc, chuẩn bị xét nghiệm và gửi câu hỏi cho
                            trợ lý 24/7.
                        </p>

                        <div className="home-hero__actions">
                            <button
                                className="primary"
                                onClick={() => this.handleNavigate("booking")}
                            >
                                Đặt lịch khám
                            </button>
                            <button
                                className="ghost"
                                onClick={() => this.handleNavigate("support")}
                            >
                                Chat với trợ lý AI
                            </button>
                        </div>
                    </div>

                    <div className="home-hero__card">
                        <div className="home-hero__card-header">
                            <span>Phòng điều phối</span>
                            <strong>Patients Monitor</strong>
                        </div>
                        <ul>
                            <li>
                                <span>Hẹn khám trong tuần</span>
                                <strong>132</strong>
                            </li>
                            <li>
                                <span>Yêu cầu hỗ trợ khẩn</span>
                                <strong>18</strong>
                            </li>
                            <li>
                                <span>Tỷ lệ phản hồi &lt; 2 phút</span>
                                <strong>98%</strong>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* ===================== STATS ====================== */}
                <section className="home-stats">
                    {STATS.map((item) => (
                        <article key={item.label}>
                            <strong>{item.value}</strong>
                            <span>{item.label}</span>
                        </article>
                    ))}
                </section>

                {/* ===================== QUICK LINKS ====================== */}
                <section className="home-links">
                    {QUICK_LINKS.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => this.handleNavigate(link.id)}
                        >
                            <p>{link.label}</p>
                            <h3>{link.title}</h3>
                            <span>{link.desc}</span>
                        </button>
                    ))}
                </section>

                {/* ===================== SPECIALTIES ====================== */}
                <section className="home-specialties">
                    <div>
                        <p className="home-hero__eyebrow">Chuyên khoa thế mạnh</p>
                        <h2>Bác sĩ đồng hành theo tình trạng sức khỏe của bạn</h2>
                        <p>
                            Các đội ngũ liên chuyên khoa phối hợp cùng hệ thống cảnh báo sớm
                            giúp phát hiện rủi ro và cá nhân hóa điều trị.
                        </p>

                        <div className="home-specialties__tags">
                            {SPECIALTIES.map((item) => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    </div>

                    <div className="home-specialties__card">
                        <h4>Trợ lý HealthCare+</h4>
                        <p>
                            Đồng bộ dữ liệu khám, nhắc thuốc, gợi ý câu hỏi trước buổi khám và
                            chăm sóc hậu điều trị. Mọi thứ đều lưu trên hồ sơ số.
                        </p>
                        <div className="home-specialties__cta">
                            <button
                                className="ghost"
                                onClick={() => this.handleNavigate("medical-records")}
                            >
                                Xem hồ sơ số
                            </button>
                            <button
                                className="primary"
                                onClick={() => this.handleNavigate("support")}
                            >
                                Nhận tư vấn ngay
                            </button>
                        </div>
                    </div>
                </section>

                {/* ===================== CTA ====================== */}
                <section className="home-cta">
                    <div>
                        <p className="home-hero__eyebrow">Trải nghiệm HealthCare+</p>
                        <h2>
                            Không chỉ khám bệnh – chúng tôi thiết kế hành trình sống khỏe.
                        </h2>
                        <p>
                            Từ đặt lịch, điều phối điều dưỡng, cập nhật hồ sơ cho đến chăm sóc từ
                            xa, mọi thứ đều minh bạch và giám sát bởi chuyên gia cùng AI.
                        </p>
                    </div>
                    <div className="home-cta__actions">
                        <button
                            className="primary"
                            onClick={() => this.handleNavigate("booking")}
                        >
                            Đặt lịch cùng điều dưỡng
                        </button>
                        <button
                            className="ghost"
                            onClick={() => this.handleNavigate("support")}
                        >
                            Liên hệ bác sĩ trực tuyến
                        </button>
                    </div>
                </section>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        isLoggedIn: state.user.isLoggedIn,
    };
};

export default connect(mapStateToProps)(HomeBody);
