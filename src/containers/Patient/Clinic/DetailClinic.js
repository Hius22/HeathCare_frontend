import React, { Component } from 'react';
import { connect } from "react-redux";
import { FormattedMessage } from 'react-intl';
import './DetailClinic.scss';
import HomeHeader from '../../HomePage/HomeHeader';
import HomeFooter from '../../HomePage/HomeFooter';
import DoctorSchedule from '../Doctor/DoctorSchedule';
import DoctorExtraInfor from '../Doctor/DoctorExtraInfor';
import ProfileDoctor from '../Doctor/ProfileDoctor';
import { getDetailClinicById, getALLCodeService } from '../../../services/userService';
import _ from 'lodash';
import { LANGUAGES } from '../../../utils';
class DetailClinic extends Component {

    constructor(props) {
        super(props);
        this.state = {
            arrDoctorId: [],
            dataDetailClinic: {},
            allDoctorsOfClinic: [],
            listSpecialty: [],
            selectedSpecialty: 'ALL'
        }
    }

    async componentDidMount() {
        if (this.props.match && this.props.match.params && this.props.match.params.id) {
            let id = this.props.match.params.id;

            let res = await getDetailClinicById({
                id: id
            });

            if (res && res.errCode === 0) {
                let data = res.data;
                let arrDoctorId = [];
                let listSpecialty = [];
                let specialtyMap = {};

                if (data && !_.isEmpty(res.data)) {
                    let arr = data.doctorClinic;
                    if (arr && arr.length > 0) {
                        arr.map(item => {
                            if (item.doctorId) {
                                arrDoctorId.push(item.doctorId);
                                if (item.specialtyData && item.specialtyData.id) {
                                    if (!specialtyMap[item.specialtyData.id]) {
                                        specialtyMap[item.specialtyData.id] = item.specialtyData.name;
                                        listSpecialty.push({
                                            id: item.specialtyData.id,
                                            name: item.specialtyData.name
                                        });
                                    }
                                }
                            }
                        })
                    }
                }

                if (listSpecialty && listSpecialty.length > 0) {
                    listSpecialty.unshift({
                        id: 'ALL',
                        name: this.props.language === LANGUAGES.VI ? 'Tất cả chuyên khoa' : 'All specialties'
                    });
                }

                this.setState({
                    dataDetailClinic: res.data,
                    arrDoctorId: arrDoctorId,
                    allDoctorsOfClinic: res.data.doctorClinic || [],
                    listSpecialty: listSpecialty,
                    selectedSpecialty: 'ALL'
                })
            }
        }
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {
            let listSpecialty = [...this.state.listSpecialty];
            if (listSpecialty && listSpecialty.length > 0) {
                listSpecialty[0].name = this.props.language === LANGUAGES.VI ? 'Tất cả chuyên khoa' : 'All specialties';
                this.setState({
                    listSpecialty: listSpecialty
                });
            }
        }
    }

    handleOnChangeSelectSpecialty = (event) => {
        let selectedSpecialty = event.target.value;
        let { allDoctorsOfClinic } = this.state;
        let arrDoctorId = [];

        if (allDoctorsOfClinic && allDoctorsOfClinic.length > 0) {
            if (selectedSpecialty === 'ALL') {
                allDoctorsOfClinic.forEach(item => {
                    if (item.doctorId) arrDoctorId.push(item.doctorId);
                });
            } else {
                allDoctorsOfClinic.forEach(item => {
                    if (item.doctorId && item.specialtyId === +selectedSpecialty) {
                        arrDoctorId.push(item.doctorId);
                    }
                });
            }
        }

        this.setState({
            selectedSpecialty: selectedSpecialty,
            arrDoctorId: arrDoctorId
        });
    }

    render() {
        let { arrDoctorId, dataDetailClinic } = this.state;
        let { language } = this.props;
        return (
            <div className='detail-clinic-container-custom'>
                <HomeHeader />
                
                {dataDetailClinic && !_.isEmpty(dataDetailClinic) && (
                    <div className="clinic-hero-banner" style={{ backgroundImage: `url(${dataDetailClinic.image || ''})` }}>
                        <div className="banner-overlay"></div>
                        <div className="banner-content">
                            <h1 className="clinic-name-heading">{dataDetailClinic.name}</h1>
                            <p className="clinic-address-text">
                                <i className="fas fa-map-marker-alt"></i> {dataDetailClinic.address}
                            </p>
                        </div>
                    </div>
                )}

                <div className='detail-clinic-body'>
                    {dataDetailClinic && !_.isEmpty(dataDetailClinic) && (
                        <div className='description-clinic-card'>
                            <h2 className="section-title-clinic">
                                <i className="fas fa-info-circle"></i> Giới thiệu chung
                            </h2>
                            <div
                                className="description-content"
                                dangerouslySetInnerHTML={{ __html: dataDetailClinic.descriptionHTML }}>
                            </div>
                        </div>
                    )}

                    {/* Specialty filter */}
                    <div className='search-clinic-doctor'>
                        <span className='filter-label'>
                            <i className='fas fa-stethoscope'></i>
                            {language === LANGUAGES.VI ? 'Chọn chuyên khoa cần khám:' : 'Select specialty:'}
                        </span>
                        <select 
                            onChange={this.handleOnChangeSelectSpecialty} 
                            className="filter-select"
                            value={this.state.selectedSpecialty}
                        >
                            {this.state.listSpecialty && this.state.listSpecialty.length > 0 &&
                                this.state.listSpecialty.map((item, index) => (
                                    <option key={index} value={item.id}>
                                        {item.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="doctors-list-section">
                        <h2 className="doctors-section-title">
                            <i className="fas fa-user-md"></i> Đội ngũ bác sĩ tại cơ sở
                        </h2>

                        {arrDoctorId && arrDoctorId.length > 0 ? (
                            arrDoctorId.map((item, index) => {
                                return (
                                    <div className='each-doctor-card' key={index}>
                                        <div className='dt-content-left'>
                                            <div className='profile-doctor'>
                                                <ProfileDoctor
                                                    doctorId={item}
                                                    isShowDescriptionDoctor={true}
                                                    isShowLinkDetail={true}
                                                    isShowPrice={false}
                                                />
                                            </div>
                                        </div>
                                        <div className='dt-content-right'>
                                            <div className='doctor-schedule'>
                                                <DoctorSchedule
                                                    doctorIdFromParent={item}
                                                />
                                            </div>
                                            <div className='doctor-extra-infor'>
                                                <DoctorExtraInfor
                                                    doctorIdFromParent={item}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="no-doctors-alert">
                                <i className="fas fa-calendar-times"></i> Hiện tại chưa có lịch khám của bác sĩ nào tại cơ sở này.
                            </div>
                        )}
                    </div>
                </div>
                <HomeFooter />
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        language: state.app.language
    };
};

const mapDispatchToProps = dispatch => {
    return {
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(DetailClinic);
