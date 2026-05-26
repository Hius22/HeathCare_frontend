import React, { Component } from "react";
import { connect } from "react-redux";
import { getClinicInfo } from "../../../services/userService";
import { withRouter } from 'react-router';
import './MedicalFacility.scss';

class MedicalFacility extends Component {
    constructor(props) {
        super(props);
        this.state = {
            clinicInfo: null,
        }
    }

    async componentDidMount() {
        let res = await getClinicInfo();
        if (res && res.errCode === 0) {
            this.setState({
                clinicInfo: res.data ? res.data : null
            })
        }
    }

    handleViewDetail = () => {
        if (this.props.history && this.state.clinicInfo) {
            this.props.history.push(`/detail-clinic/${this.state.clinicInfo.id}`);
        }
    }

    handleBookAppointment = () => {
        this.props.history.push('/booking-flow');
    }

    render() {
        let { clinicInfo } = this.state;
        return (
            <section className="facility-section section-padding">
                <div className="section-container-main">
                    <div className="section-header-center">
                        <h2 className="section-title">
                            {this.props.language === 'vi' ? 'CƠ SỞ Y TẾ' : 'Medical Facilities'}
                        </h2>
                        <p className="section-subtitle-center">
                            {this.props.language === 'vi'
                                ? 'Hệ thống bệnh viện và phòng khám hiện đại'
                                : 'Modern hospitals and clinic network'}
                        </p>
                    </div>

                    {clinicInfo && (
                        <div className="facility-featured" onClick={() => this.handleViewDetail()}>
                            <div className="facility-image-wrapper">
                                {clinicInfo.image ? (
                                    <img
                                        alt={clinicInfo.name}
                                        className="facility-image"
                                        src={clinicInfo.image}
                                    />
                                ) : (
                                    <div className="facility-image-placeholder">
                                        <i className="fa-solid fa-hospital"></i>
                                    </div>
                                )}
                            </div>

                            <div className="facility-content">
                                <div className="facility-header">
                                    <h3 className="facility-name">{clinicInfo.name}</h3>
                                    <div className="facility-location">
                                        <i className="fa-solid fa-location-dot"></i>
                                        <span>{clinicInfo.address}</span>
                                    </div>
                                </div>

                                <div
                                    className="facility-description"
                                    dangerouslySetInnerHTML={{ __html: clinicInfo.descriptionHTML }}
                                />

                                <div className="facility-actions">
                                    <button
                                        className="btn-primary-action"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.handleBookAppointment();
                                        }}
                                    >
                                        <i className="fa-solid fa-calendar-check"></i>
                                        {this.props.language === 'vi' ? 'Đặt lịch khám ngay' : 'Book appointment'}
                                    </button>
                                    <button
                                        className="btn-secondary-action"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            this.handleViewDetail();
                                        }}
                                    >
                                        <i className="fa-solid fa-circle-info"></i>
                                        {this.props.language === 'vi' ? 'Xem chi tiết' : 'View details'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        );
    }
}

const mapStateToProps = state => ({
    isLoggedIn: state.user.isLoggedIn,
    language: state.app.language
});

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MedicalFacility));