import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import * as actions from "../../../store/actions";
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import './ManageDoctor.scss';
import Select from 'react-select';
import { CRUD_ACTIONS, LANGUAGES } from "../../../utils";
import { getDetailInforDoctor } from '../../../services/userService';

const mdParser = new MarkdownIt(/* Markdown-it options */);

class ManageDoctor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            //save to markdown table
            contentHTML: '',
            contentMarkdown: '',
            selectedDoctor: '',
            description: '',
            hasOldData: false,
            listDoctors: [],

            //save to doctor_infor table
            listPrice: [],
            listPayment: [],
            listProvince: [],
            selectedPrice: '',
            selectedPayment: '',
            selectedProvince: '',
            nameClinic: '',
            addressClinic: '',
            note: '',

        }
    }

    componentDidMount() {
        this.props.fetchALLDoctors();
        this.props.getAllRequiredDoctorInfor();
    }

    buildDataInputSelect = (inputData, type) => {
        let result = [];
        let { language } = this.props;
        if (inputData && inputData.length > 0) {
            inputData.map((item, index) => {
                let object = {};
                let labelVi = type === 'USERS' ? `${item.lastName} ${item.firstName}` : item.valueVi;
                let labelEn = type === 'USERS' ? `${item.firstName} ${item.lastName}` : item.valueEn;
                object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                object.value = item.id;
                result.push(object)
            })
        }

        return result;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.allDoctors !== this.props.allDoctors) {
            let dataSelect = this.buildDataInputSelect(this.props.allDoctors, 'USERS');
            this.setState({
                listDoctors: dataSelect
            })
        }

        if (prevProps.language !== this.props.language) {
            let dataSelect = this.buildDataInputSelect(this.props.allDoctors)
            this.setState({
                listDoctors: dataSelect
            })
        }

        if (prevProps.allRequiredDoctorInfor !== this.props.allRequiredDoctorInfor) {
            let { resPayment, resPrice, resProvince } = this.props.allRequiredDoctorInfor;
            let dataSelectPrice = this.buildDataInputSelect(resPrice);
            let dataSelectPayment = this.buildDataInputSelect(resPayment);
            let dataSelectProvince = this.buildDataInputSelect(resProvince);

            this.setState({
                listPrice: dataSelectPrice,
                listPayment: dataSelectPayment,
                listProvince: dataSelectProvince
            })
        }
    }

    // Finish!
    handleEditorChange = ({ html, text }) => {
        this.setState({
            contentHTML: html,
            contentMarkdown: text,
        })
        //console.log('handleEditorChange', html, text);
    }

    handleSaveContentMarkdown = () => {
        let { hasOldData, selectedDoctor } = this.state;
        if (!selectedDoctor) {
            alert("Vui lòng chọn bác sĩ!");
            return;
        }
        this.props.saveDetailDoctor({
            contentHTML: this.state.contentHTML,
            contentMarkdown: this.state.contentMarkdown,
            description: this.state.description,
            doctorId: this.state.selectedDoctor.value,
            action: hasOldData === true ? CRUD_ACTIONS.EDIT : CRUD_ACTIONS.CREATE
        })
        //console.log("check state: ", this.state)
    }

    handleChangeSelect = async (selectedOption) => {
        this.setState({ selectedDoctor: selectedOption });

        let res = await getDetailInforDoctor(selectedOption.value);
        if (res && res.errCode === 0 && res.data && res.data.MarkDown) {
            let markdown = res.data.MarkDown;
            this.setState({
                contentHTML: markdown.contentHTML,
                contentMarkdown: markdown.contentMarkdown,
                description: markdown.description,
                hasOldData: true
            })
        } else {
            this.setState({
                contentHTML: '',
                contentMarkdown: '',
                description: '',
                hasOldData: false
            })
        }
        console.log(`Option selected:`, res)

    };

    handleOnChangeDesc = (event) => {
        this.setState({
            description: event.target.value
        })
    }

    render() {
        let { hasOldData } = this.state;
        return (
            <div className='manage-doctor-container'>
                <div className='manage-doctor-title'>
                    <FormattedMessage id="admin.manage-doctor.title" />
                </div>
                <div className='more-infor'>
                    <div className='content-left form-group'>
                        <label><FormattedMessage id="admin.manage-doctor.select-doctor" /></label>
                        <Select
                            value={this.state.selectedDoctor}
                            onChange={this.handleChangeSelect}
                            options={this.state.listDoctors}
                            placeholder={'Chọn bác sĩ...'}
                        />
                    </div>
                    <div className='content-right'>
                        <label><FormattedMessage id="admin.manage-doctor.information" /></label>
                        <textarea
                            className='form-control'
                            onChange={(event) => this.handleOnChangeDesc(event)}
                            value={this.state.description}
                        >
                        </textarea>
                    </div>
                </div>

                <div className='more-infor-extra row'>
                    <div className='col-4 form-group'>
                        <label>Chon gia</label>
                        <Select
                            //value={this.state.selectedDoctor}
                            //onChange={this.handleChangeSelect}
                            options={this.state.listPrice}
                            placeholder={'Chọn giá...'}
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label>Chon phuong thuc thanh toan</label>
                        <Select
                            //value={this.state.selectedDoctor}
                            //onChange={this.handleChangeSelect}
                            options={this.state.listPayment}
                            placeholder={'Chọn phương thức thanh toán...'}
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label>Chon tinh thanh</label>
                        <Select
                            //value={this.state.selectedDoctor}
                            //onChange={this.handleChangeSelect}
                            options={this.state.listProvince}
                            placeholder={'Chọn tỉnh thành...'}
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label>Ten phong kham</label>
                        <input className='form-control' />
                    </div>
                    <div className='col-4 form-group'>
                        <label>Dia chi phong kham</label>
                        <input className='form-control' />
                    </div>
                    <div className='col-4 form-group'>
                        <label>Ghi chu</label>
                        <input className='form-control' />
                    </div>
                </div>
                <div className='manage-doctor-editor'>
                    <MdEditor
                        style={{ height: '500px' }}
                        renderHTML={text => mdParser.render(text)}
                        onChange={this.handleEditorChange}
                        value={this.state.contentMarkdown}
                    />
                </div>
                <button
                    onClick={() => this.handleSaveContentMarkdown()}
                    className={hasOldData === true ? 'save-content-doctor' : 'create-content-doctor'}>
                    {hasOldData === true ?
                        <span>
                            <FormattedMessage id="admin.manage-doctor.create" />
                        </span>
                        :
                        <span>
                            <FormattedMessage id="admin.manage-doctor.save" />
                        </span>
                    }
                </button>
            </div>

        );
    }

}

const mapStateToProps = state => {
    return {
        allDoctors: state.admin.allDoctors,
        language: state.app.language,
        allRequiredDoctorInfor: state.admin.allRequiredDoctorInfor
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchALLDoctors: () => dispatch(actions.fetchALLDoctors()),
        saveDetailDoctor: (data) => dispatch(actions.saveDetailDoctor(data)),
        getAllRequiredDoctorInfor: () => dispatch(actions.getAllRequiredDoctorInfor()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageDoctor);
