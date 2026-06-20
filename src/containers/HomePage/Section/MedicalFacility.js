import React, { Component } from "react";
import { connect } from "react-redux";
import { getAllClinic } from "../../../services/userService";
import { withRouter } from 'react-router';
import './MedicalFacility.scss';

class MedicalFacility extends Component {
    constructor(props) {
        super(props);
        this.state = {
            listClinics: [],
        }
    }

    async componentDidMount() {
        let res = await getAllClinic();
        if (res && res.errCode === 0) {
            this.setState({
                listClinics: res.data ? res.data : []
            })
        }
    }

    handleViewDetail = (id) => {
        if (this.props.history && id) {
            this.props.history.push(`/detail-clinic/${id}`);
        }
    }

    handleBookAppointment = (id) => {
        if (id) {
            this.props.history.push(`/booking-flow?clinicId=${id}`);
        } else {
            this.props.history.push('/booking-flow');
        }
    }

    render() {
        let { listClinics } = this.state;
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

                    <div className="facility-grid">
                        {listClinics && listClinics.length > 0 &&
                            listClinics.map((item, index) => {
                                return (
                                    <div className="facility-card-item" key={index} onClick={() => this.handleViewDetail(item.id)}>
                                        <div className="facility-image-wrapper">
                                            {item.image ? (
                                                <img
                                                    alt={item.name}
                                                    className="facility-image"
                                                    src={item.image}
                                                />
                                            ) : (
                                                <div className="facility-image-placeholder">
                                                    <i className="fa-solid fa-hospital"></i>
                                                </div>
                                            )}
                                        </div>

                                        <div className="facility-content">
                                            <div className="facility-header">
                                                <h3 className="facility-name">{item.name}</h3>
                                                <div className="facility-location">
                                                    <i className="fa-solid fa-location-dot"></i>
                                                    <span>{item.address}</span>
                                                </div>
                                            </div>

                                            <div className="facility-actions">
                                                <button
                                                    className="btn-primary-action"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.handleBookAppointment(item.id);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-calendar-check"></i>
                                                    {this.props.language === 'vi' ? 'Đặt lịch' : 'Book'}
                                                </button>
                                                <button
                                                    className="btn-secondary-action"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        this.handleViewDetail(item.id);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-circle-info"></i>
                                                    {this.props.language === 'vi' ? 'Chi tiết' : 'Details'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
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