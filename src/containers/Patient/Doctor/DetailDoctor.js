import React, { Component } from 'react';
import { connect } from "react-redux";
import HomeHeader from '../../HomePage/HomeHeader';
import './DetailDoctor.scss';
import { getDetailInforDoctor } from '../../../services/userService';
import { LANGUAGES } from '../../../utils';
import DoctorSchedule from './DoctorSchedule';
import DoctorExtraInfor from './DoctorExtraInfor';
import HomeFooter from '../../HomePage/HomeFooter';

class DetailDoctor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            detailDoctor: {},
            currentDoctorId: -1,
        }
    }

    async componentDidMount() {
        if (this.props.match && this.props.match.params && this.props.match.params.id) {
            let id = this.props.match.params.id;
            this.setState({ currentDoctorId: id });

            let res = await getDetailInforDoctor(id);
            if (res && res.errCode === 0) {
                this.setState({ detailDoctor: res.data });
            }
        }
    }

    render() {
        let { language } = this.props;
        let { detailDoctor } = this.state;
        let nameVi = '', nameEn = '';
        if (detailDoctor && detailDoctor.positionData) {
            nameVi = `${detailDoctor.positionData.valueVi}, ${detailDoctor.lastName} ${detailDoctor.firstName}`;
            nameEn = `${detailDoctor.positionData.valueEn}, ${detailDoctor.firstName} ${detailDoctor.lastName}`;
        }

        const specialtyName = detailDoctor?.Doctor_Infor?.specialtyData?.name || '';
        const clinicName = detailDoctor?.Doctor_Infor?.clinicData?.name || '';

        return (
            <>
                <HomeHeader isShowBanner={false} />

                <div className='doctor-detail-container'>
                    {/* ── Hero intro ── */}
                    <div className='intro-doctor'>
                        <div className='intro-inner'>
                            <div
                                className='content-left'
                                style={{
                                    backgroundImage: `url(${detailDoctor && detailDoctor.image ? detailDoctor.image : ''})`
                                }}
                            />
                            <div className='content-right'>
                                <div className='up'>
                                    {language === LANGUAGES.VI ? nameVi : nameEn}
                                </div>

                                {detailDoctor && detailDoctor.MarkDown && detailDoctor.MarkDown.description && (
                                    <div className='down'>
                                        <span>{detailDoctor.MarkDown.description}</span>
                                    </div>
                                )}

                                <div className='doctor-tags'>
                                    {/* All specialties from M-N junction table */}
                                    {detailDoctor?.doctorSpecialties && detailDoctor.doctorSpecialties.length > 0
                                        ? detailDoctor.doctorSpecialties.map((ds, idx) => (
                                            ds.specialtyData && (
                                                <span className='tag' key={idx}>
                                                    <i className='fas fa-stethoscope'></i>
                                                    {ds.specialtyData.name}
                                                </span>
                                            )
                                        ))
                                        : (detailDoctor?.Doctor_Infor?.specialtyData?.name && (
                                            <span className='tag'>
                                                <i className='fas fa-stethoscope'></i>
                                                {detailDoctor.Doctor_Infor.specialtyData.name}
                                            </span>
                                        ))
                                    }
                                    {clinicName && (
                                        <span className='tag'>
                                            <i className='fas fa-hospital'></i>
                                            {clinicName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Schedule & Extra info ── */}
                    <div className='detail-page-body'>
                        <div className='schedule-doctor'>
                            <div className='content-left'>
                                <DoctorSchedule doctorIdFromParent={this.state.currentDoctorId} />
                            </div>
                            <div className='content-right'>
                                <DoctorExtraInfor doctorIdFromParent={this.state.currentDoctorId} />
                            </div>
                        </div>

                        {/* ── Full bio / content HTML ── */}
                        {detailDoctor && detailDoctor.MarkDown && detailDoctor.MarkDown.contentHTML && (
                            <div className='detail-infor-doctor'>
                                <div dangerouslySetInnerHTML={{ __html: detailDoctor.MarkDown.contentHTML }} />
                            </div>
                        )}
                    </div>
                </div>

                <HomeFooter />
            </>
        );
    }
}

const mapStateToProps = state => ({
    language: state.app.language
});

const mapDispatchToProps = dispatch => ({ });

export default connect(mapStateToProps, mapDispatchToProps)(DetailDoctor);
