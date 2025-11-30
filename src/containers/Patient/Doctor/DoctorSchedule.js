import React, { Component } from 'react';
import { connect } from "react-redux";
import './DoctorSchedule.scss';
import moment, { lang } from 'moment';
import 'moment/min/locales';
import { LANGUAGES } from '../../../utils';
import { getScheduleDoctorByDate } from '../../../services/userService';
import { FormattedMessage } from 'react-intl';

class DoctorSchedule extends Component {

    constructor(props) {
        super(props);
        this.state = {
            allDays: [],
            allAvailableTime: [],
        }
    }

    async componentDidMount() {
        let { language } = this.props;
        let allDays = this.getArrDays(language);
        this.setState({
            allDays: allDays,
        })
    }

    getArrDays = (language) => {
        let allDays = []
        for (let i = 0; i < 7; i++) {
            let object = {};
            let date = moment(new Date()).add(i, 'days');

            if (i === 0) {
                // Ngày đầu tiên hiển thị Hôm nay / Today
                object.label = language === LANGUAGES.VI
                    ? `Hôm nay - ${date.format('DD/MM')}`
                    : `Today - ${date.locale('en').format('DD/MM')}`;
            } else {
                // Các ngày còn lại hiển thị đầy đủ thứ
                if (language === LANGUAGES.VI) {
                    let labelVi = date.locale('vi').format('dddd - DD/MM');
                    object.label = labelVi.charAt(0).toUpperCase() + labelVi.slice(1); // chữ đầu viết hoa
                } else {
                    object.label = date.locale('en').format('dddd - DD/MM');
                }
            }

            object.value = date.startOf('day').valueOf();
            allDays.push(object);
        }

        return allDays;
    }
    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.language !== prevProps.language) {
            let allDays = this.getArrDays(this.props.language);
            this.setState({
                allDays: allDays
            })
        }
        if (this.props.doctorIdFromParent !== prevProps.doctorIdFromParent) {
            let allDays = this.getArrDays(this.props.language)
            let res = await getScheduleDoctorByDate(this.props.doctorIdFromParent, allDays[0].value);
            this.setState({
                allAvailableTime: res.data ? res.data : []
            })
        }
    }

    handleOnChangeSelect = async (event) => {
        if (this.props.doctorIdFromParent && this.props.doctorIdFromParent !== -1) {
            let doctorId = this.props.doctorIdFromParent;
            let date = event.target.value
            let res = await getScheduleDoctorByDate(doctorId, date);

            if (res && res.errCode === 0) {
                this.setState({
                    allAvailableTime: res.data ? res.data : []
                })
            }

            console.log('check res: ', res)
        }
    }

    render() {
        let { allDays, allAvailableTime } = this.state;
        let { language } = this.props;
        return (
            <div className='doctor-schedule-container'>
                <div className='all-schedule'>
                    <select onChange={(event) => this.handleOnChangeSelect(event)}>
                        {allDays && allDays.length > 0 && allDays.map((item, index) => {
                            return (
                                <option
                                    value={item.value}
                                    key={index}
                                >
                                    {item.label}
                                </option>
                            )
                        })}
                    </select>
                </div>
                <div className='all-available-time'>
                    <div className='text-calendar'>
                        <i className="fa-solid fa-calendar-days">
                            <span><FormattedMessage id="patient.detail-doctor.schedule" /></span>
                        </i>
                    </div>
                    <div className='time-content'>
                        {allAvailableTime && allAvailableTime.length > 0 ?
                            <>
                                <div className='time-content-btns'>
                                    {allAvailableTime.map((item, index) => {
                                        let timeDisplay = language === LANGUAGES.VI ? item.timeTypeData.valueVi : item.timeTypeData.valueEn;
                                        return (
                                            <button
                                                key={index}
                                                className={language === LANGUAGES.VI ? 'btn-vie' : 'btn-en'}
                                            >
                                                {timeDisplay}
                                            </button>
                                        )
                                    })
                                    }
                                </div>

                                <div className='book-free'>
                                    <span>
                                        <FormattedMessage id="patient.detail-doctor.choose" />
                                        <i className="fa-regular fa-hand-pointer"></i>
                                        <FormattedMessage id="patient.detail-doctor.book-free" />
                                    </span>
                                </div>
                            </>
                            :
                            <div className='text'><FormattedMessage id="patient.detail-doctor.no-schedule" /></div>
                        }
                    </div>
                </div>
            </div>
        );
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

export default connect(mapStateToProps, mapDispatchToProps)(DoctorSchedule);
