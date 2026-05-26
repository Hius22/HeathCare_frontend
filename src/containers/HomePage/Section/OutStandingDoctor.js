import React, { Component } from "react";
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import Slider from "react-slick";
import * as actions from "../../../store/actions";
import { LANGUAGES } from "../../../utils";
import { withRouter } from 'react-router';
import './OutStandingDoctor.scss';

class OutStandingDoctor extends Component {
    constructor(props) {
        super(props)
        this.state = {
            arrDoctors: []
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.topDoctorsRedux !== this.props.topDoctorsRedux) {
            this.setState({
                arrDoctors: this.props.topDoctorsRedux
            })
        }
    }

    componentDidMount() {
        this.props.loadTopDoctors();
    }

    handleViewDetailDoctor = (doctor) => {
        if (this.props.history) {
            this.props.history.push(`/detail-doctor/${doctor.id}`);
        }
    }

    render() {
        let arrDoctors = this.state.arrDoctors;
        let { language } = this.props;
        let displayDoctors = arrDoctors.slice(0, 4);
        let hasMore = arrDoctors.length > 4;

        return (
            <section className="doctors-section section-padding">
                <div className="section-container-main">
                    <div className="section-header-flex">
                        <div>
                            <h2 className="section-title-left">
                                {language === LANGUAGES.VI ? 'Bác Sĩ Nổi Bật' : 'Featured Doctors'}
                            </h2>
                            <p className="section-subtitle">
                                {language === LANGUAGES.VI
                                    ? 'Đội ngũ chuyên gia hàng đầu từ các bệnh viện lớn'
                                    : 'Top medical experts from leading hospitals'}
                            </p>
                        </div>
                        {hasMore && (
                            <button
                                className="view-all-link"
                                onClick={() => this.props.history.push('/doctors')}
                            >
                                Xem tất cả <span>→</span>
                            </button>
                        )}
                    </div>

                    <div className="doctors-grid">
                        {displayDoctors && displayDoctors.length > 0
                            && displayDoctors.map((item, index) => {
                                let imageUrl = item.image || '';
                                let nameVi = `${item.positionData.valueVi}, ${item.lastName} ${item.firstName}`;
                                let nameEn = `${item.positionData.valueEn}, ${item.firstName} ${item.lastName}`;
                                return (
                                    <div className="doctor-card" key={index} onClick={() => this.handleViewDetailDoctor(item)}>
                                        <img
                                            alt={language === LANGUAGES.VI ? nameVi : nameEn}
                                            className="doctor-image"
                                            src={imageUrl}
                                        />
                                        <div className="doctor-info">
                                            <h4 className="doctor-name">{language === LANGUAGES.VI ? nameVi : nameEn}</h4>
                                            <p className="doctor-specialty">
                                                {item.Doctor_Infor?.specialtyData?.name || ''}
                                            </p>
                                            <button className="book-btn">
                                                {language === LANGUAGES.VI ? 'Đặt lịch' : 'Book now'}
                                            </button>
                                        </div>
                                    </div>
                                )
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
    topDoctorsRedux: state.admin.topDoctors,
    language: state.app.language,
});

const mapDispatchToProps = dispatch => {
    return {
        loadTopDoctors: () => dispatch(actions.fetchTopDoctor())
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(OutStandingDoctor));
