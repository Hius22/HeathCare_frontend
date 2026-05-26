import React, { Component } from "react";
import { connect } from "react-redux";
import { LANGUAGES } from '../../../utils';
import Slider from "react-slick";
import { getAllSpecialty } from '../../../services/userService';
import './Specialty.scss';
import { withRouter } from 'react-router';
class Specialty extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSpecialty: [],

        }
    }

    async componentDidMount() {
        let res = await getAllSpecialty();
        //console.log('check res1:', res)
        if (res && res.errCode === 0) {
            this.setState({
                dataSpecialty: res.data ? res.data : []
            });
        }
    }

    handleViewDetailSpecialty = (item) => {
        if (this.props.history) {
            this.props.history.push(`/detail-specialty/${item.id}`);
        }
    }

    render() {
        let { dataSpecialty } = this.state;
        let displaySpecialties = dataSpecialty.slice(0, 5);
        let hasMore = dataSpecialty.length > 5;

        return (
            <section className="specialty-section section-padding">
                <div className="section-container-main">
                    <div className="section-header-center">
                        <h2 className="section-title">
                            {this.props.language === LANGUAGES.VI ? 'Chuyên Khoa Phổ Biến' : 'Popular Specialties'}
                        </h2>
                        <div className="title-underline"></div>
                    </div>

                    <div className="specialty-grid">
                        {displaySpecialties && displaySpecialties.length > 0 &&
                            displaySpecialties.map((item, index) => {
                                return (
                                    <div className="specialty-card"
                                        key={index}
                                        onClick={() => this.handleViewDetailSpecialty(item)}
                                    >
                                        <div className="specialty-icon-wrapper">
                                            <div className="specialty-image"
                                                style={{ backgroundImage: `url(${item.image})` }}
                                            />
                                        </div>
                                        <h4 className="specialty-name">{item.name}</h4>
                                    </div>
                                )
                            })
                        }
                    </div>

                    {hasMore && (
                        <div className="section-footer">
                            <button
                                className="view-all-btn"
                                onClick={() => this.props.history.push('/all-specialty')}
                            >
                                {this.props.language === LANGUAGES.VI ? 'Xem tất cả →' : 'View all →'}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        );
    }
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.user.isLoggedIn,
    language: state.app.language,
});

const mapDispatchToProps = dispatch => {
    return {

    };
};


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Specialty));
