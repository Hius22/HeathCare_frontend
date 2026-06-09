import React, { Component } from 'react';
import { connect } from "react-redux";
import './DetailSpecialty.scss';
import HomeHeader from '../../HomePage/HomeHeader';
import HomeFooter from '../../HomePage/HomeFooter';
import DoctorSchedule from '../Doctor/DoctorSchedule';
import DoctorExtraInfor from '../Doctor/DoctorExtraInfor';
import ProfileDoctor from '../Doctor/ProfileDoctor';
import { getDetailSpecialtyById, getALLCodeService } from '../../../services/userService';
import _ from 'lodash';
import { LANGUAGES } from '../../../utils';

class DetailSpecialty extends Component {

    constructor(props) {
        super(props);
        this.state = {
            arrDoctorId: [],
            dataDetailSpecialty: {},
            listProvince: [],
        }
    }

    async componentDidMount() {
        if (this.props.match && this.props.match.params && this.props.match.params.id) {
            let id = this.props.match.params.id;

            let [res, resProvince] = await Promise.all([
                getDetailSpecialtyById({ id, location: 'ALL' }),
                getALLCodeService('PROVINCE')
            ]);

            if (res && res.errCode === 0 && resProvince && resProvince.errCode === 0) {
                let data = res.data;
                let arrDoctorId = [];
                if (data && !_.isEmpty(data)) {
                    let arr = data.doctorSpecialty;
                    if (arr && arr.length > 0) {
                        arr.forEach(item => {
                            if (item.doctorId) arrDoctorId.push(item.doctorId);
                        });
                    }
                }

                let dataProvince = resProvince.data;
                if (dataProvince && dataProvince.length > 0) {
                    dataProvince.unshift({
                        createdAt: null,
                        keyMap: 'ALL',
                        type: 'PROVINCE',
                        valueEn: 'All provinces',
                        valueVi: 'Tất cả tỉnh thành'
                    });
                }

                this.setState({
                    dataDetailSpecialty: res.data,
                    arrDoctorId,
                    listProvince: dataProvince || []
                });
            }
        }
    }

    handleOnChangeSelect = async (event) => {
        if (this.props.match && this.props.match.params && this.props.match.params.id) {
            let id = this.props.match.params.id;
            let location = event.target.value;

            let res = await getDetailSpecialtyById({ id, location });
            if (res && res.errCode === 0) {
                let data = res.data;
                let arrDoctorId = [];
                if (data && !_.isEmpty(data)) {
                    let arr = data.doctorSpecialty;
                    if (arr && arr.length > 0) {
                        arr.forEach(item => arrDoctorId.push(item.doctorId));
                    }
                }
                this.setState({ dataDetailSpecialty: res.data, arrDoctorId });
            }
        }
    }
    render() {
        let { arrDoctorId, dataDetailSpecialty, listProvince } = this.state;
        let { language } = this.props;

        return (
            <div className='detail-specialty-container-custom'>
                <HomeHeader isShowBanner={false} />

                {/* ── Specialty hero banner ── */}
                {dataDetailSpecialty && !_.isEmpty(dataDetailSpecialty) && (
                    <div className="specialty-hero-banner" style={{ backgroundImage: `url(${dataDetailSpecialty.image || ''})` }}>
                        <div className="banner-overlay"></div>
                        <div className="banner-content">
                            <h1 className="specialty-name-heading">{dataDetailSpecialty.name}</h1>
                        </div>
                    </div>
                )}

                {/* ── Specialty body ── */}
                <div className='detail-specialty-body'>
                    {dataDetailSpecialty && !_.isEmpty(dataDetailSpecialty) && (
                        <div className='description-specialty-card'>
                            <h2 className="section-title-specialty">
                                <i className="fas fa-info-circle"></i> Giới thiệu chuyên khoa
                            </h2>
                            <div
                                className="description-content"
                                dangerouslySetInnerHTML={{ __html: dataDetailSpecialty.descriptionHTML }}
                            />
                        </div>
                    )}

                    {/* Province filter */}
                    <div className='search-sp-doctor'>
                        <span className='filter-label'>
                            <i className='fas fa-map-marker-alt'></i>
                            {language === LANGUAGES.VI ? 'Lọc theo tỉnh thành:' : 'Filter by province:'}
                        </span>
                        <select onChange={this.handleOnChangeSelect} className="filter-select">
                            {listProvince && listProvince.length > 0 &&
                                listProvince.map((item, index) => (
                                    <option key={index} value={item.keyMap}>
                                        {language === LANGUAGES.VI ? item.valueVi : item.valueEn}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Doctor list heading */}
                    <div className="doctors-list-section-header">
                        <h2 className="doctors-section-title">
                            <i className="fas fa-user-md"></i> Đội ngũ bác sĩ chuyên khoa
                        </h2>
                    </div>

                    {/* Doctor cards */}
                    {arrDoctorId && arrDoctorId.length > 0
                        ? arrDoctorId.map((item, index) => (
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
                                        <DoctorSchedule doctorIdFromParent={item} />
                                    </div>
                                    <div className='doctor-extra-infor'>
                                        <DoctorExtraInfor doctorIdFromParent={item} />
                                    </div>
                                </div>
                            </div>
                        ))
                        : (
                            <div className='no-doctors-alert'>
                                <i className='fas fa-user-md-slash'></i>
                                <p>
                                    {language === LANGUAGES.VI
                                        ? 'Chưa có bác sĩ trong khu vực này.'
                                        : 'No doctors available in this area.'}
                                </p>
                            </div>
                        )
                    }
                </div>

                <HomeFooter />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    language: state.app.language
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(DetailSpecialty);
