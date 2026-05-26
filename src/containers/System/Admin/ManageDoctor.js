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
            listProvince: [],
            listSpecialty: [],
            listClinicName: [],
            listClinicAddress: [],

            selectedPrice: '',
            selectedProvince: '',
            selectedSpecialty: [],
            selectedClinicName: '',
            selectedClinicAddress: '',

            note: ''
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
            if (type === 'USERS') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.lastName} ${item.firstName}`;
                    let labelEn = `${item.firstName} ${item.lastName}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.id;
                    result.push(object)
                })
            }
            if (type === 'PRICE') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi} đ`;
                    let labelEn = `${item.valueEn} $`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'PAYMENT') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'PROVINCE') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'SPECIALTY') {
                inputData.map((item, index) => {
                    let object = {};
                    object.label = item.name;
                    object.value = item.id;
                    result.push(object)
                })
            }

            if (type === 'CLINIC_NUMBER') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

            if (type === 'CLINIC_ADDRESS') {
                inputData.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object)
                })
            }

        }

        return result;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Guard: only update if props actually changed (reference check)
        if (prevProps.allDoctors !== this.props.allDoctors) {
            let dataSelect = this.buildDataInputSelect(this.props.allDoctors, 'USERS');
            this.setState({ listDoctors: dataSelect });
        }

        if (prevProps.allRequiredDoctorInfor !== this.props.allRequiredDoctorInfor) {
            let { resPrice, resProvince, resSpecialty, resClinicName, resClinicAddress } = this.props.allRequiredDoctorInfor;

            // Guard: only proceed if we have valid data
            if (!resPrice || !resProvince || !resSpecialty) return;

            this.setState({
                listPrice: this.buildDataInputSelect(resPrice, 'PRICE'),
                listProvince: this.buildDataInputSelect(resProvince, 'PROVINCE'),
                listSpecialty: this.buildDataInputSelect(resSpecialty, 'SPECIALTY'),
                listClinicName: this.buildDataInputSelect(resClinicName || [], 'CLINIC_NUMBER'),
                listClinicAddress: this.buildDataInputSelect(resClinicAddress || [], 'CLINIC_ADDRESS'),
            });
        }

        if (prevProps.language !== this.props.language) {
            // Guard: only proceed if required data is loaded
            if (!this.props.allRequiredDoctorInfor || !this.props.allDoctors) return;

            let { resPrice, resProvince, resClinicName, resClinicAddress } = this.props.allRequiredDoctorInfor;

            this.setState({
                listDoctors: this.buildDataInputSelect(this.props.allDoctors, 'USERS'),
                listPrice: this.buildDataInputSelect(resPrice, 'PRICE'),
                listProvince: this.buildDataInputSelect(resProvince, 'PROVINCE'),
                listClinicName: this.buildDataInputSelect(resClinicName || [], 'CLINIC_NUMBER'),
                listClinicAddress: this.buildDataInputSelect(resClinicAddress || [], 'CLINIC_ADDRESS'),
            });
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
        let { hasOldData } = this.state;

        this.props.saveDetailDoctor({
            contentHTML: this.state.contentHTML,
            contentMarkdown: this.state.contentMarkdown,
            description: this.state.description,
            doctorId: this.state.selectedDoctor.value,
            action: hasOldData === true ? CRUD_ACTIONS.EDIT : CRUD_ACTIONS.CREATE,

            selectedPrice: this.state.selectedPrice.value,
            selectedProvince: this.state.selectedProvince.value,
            nameClinic: this.state.selectedClinicName ? this.state.selectedClinicName.label : '',
            addressClinic: this.state.selectedClinicAddress ? this.state.selectedClinicAddress.label : '',
            note: this.state.note,
            // Send array of specialtyIds for many-to-many
            specialtyIds: (this.state.selectedSpecialty || []).map(sp => sp.value),
            // Also keep legacy specialtyId = first selected for backward compat
            specialtyId: this.state.selectedSpecialty && this.state.selectedSpecialty.length > 0
                ? this.state.selectedSpecialty[0].value : '',
            clinicNameCode: this.state.selectedClinicName ? this.state.selectedClinicName.value : '',
            clinicAddressCode: this.state.selectedClinicAddress ? this.state.selectedClinicAddress.value : '',
        })
    }

    handleChangeSelect = async (selectedOption) => {
        this.setState({ selectedDoctor: selectedOption });
        let { listPrice, listProvince, listSpecialty } = this.state;

        let res = await getDetailInforDoctor(selectedOption.value);
        if (res && res.errCode === 0 && res.data && res.data.MarkDown) {
            let markdown = res.data.MarkDown;

            let note = '', priceId = '', provinceId = '',
                selectedPrice = '', selectedProvince = '', selectedSpecialty = [],
                selectedClinicName = '', selectedClinicAddress = '',
                clinicNameCode = '', clinicAddressCode = '';

            let { listPrice, listProvince, listClinicName, listClinicAddress } = this.state;

            if (res.data.Doctor_Infor) {
                note = res.data.Doctor_Infor.note;
                priceId = res.data.Doctor_Infor.priceId;
                provinceId = res.data.Doctor_Infor.provinceId;
                clinicNameCode = res.data.Doctor_Infor.clinicNameCode;
                clinicAddressCode = res.data.Doctor_Infor.clinicAddressCode;

                let nameClinicText = res.data.Doctor_Infor.nameClinic;
                let addressClinicText = res.data.Doctor_Infor.addressClinic;

                selectedPrice = listPrice.find(item => item && item.value === priceId);
                selectedProvince = listProvince.find(item => item && item.value === provinceId);

                // Load specialty as multi-select array from doctorSpecialties (M-N)
                if (res.data.doctorSpecialties && res.data.doctorSpecialties.length > 0) {
                    selectedSpecialty = res.data.doctorSpecialties
                        .map(ds => {
                            return this.state.listSpecialty.find(sp => sp && sp.value === ds.specialtyId);
                        })
                        .filter(Boolean);
                } else if (res.data.Doctor_Infor.specialtyId) {
                    // Fallback: legacy single specialty from doctor_infor
                    let found = this.state.listSpecialty.find(item =>
                        item && item.value === res.data.Doctor_Infor.specialtyId
                    );
                    if (found) selectedSpecialty = [found];
                }

                selectedClinicName = clinicNameCode
                    ? listClinicName.find(item => item && item.value === clinicNameCode)
                    : listClinicName.find(item => item && item.label === nameClinicText);

                selectedClinicAddress = clinicAddressCode
                    ? listClinicAddress.find(item => item && item.value === clinicAddressCode)
                    : listClinicAddress.find(item => item && item.label === addressClinicText);
            }

            this.setState({
                contentHTML: markdown.contentHTML,
                contentMarkdown: markdown.contentMarkdown,
                description: markdown.description,
                hasOldData: true,
                note: note,
                selectedPrice: selectedPrice,
                selectedProvince: selectedProvince,
                selectedSpecialty: selectedSpecialty,
                selectedClinicName: selectedClinicName || '',
                selectedClinicAddress: selectedClinicAddress || '',
            })

        } else {
            this.setState({
                contentHTML: '',
                contentMarkdown: '',
                description: '',
                hasOldData: false,
                note: '',
                selectedPrice: '',
                selectedProvince: '',
                selectedSpecialty: [],
                selectedClinicName: '',
                selectedClinicAddress: '',
            })
        }
        //console.log(`Option selected:`, res)

    };

    handleChangeSelectDoctorInfor = async (selectedDoctor, name) => {
        let stateName = name.name;
        let stateCopy = { ...this.state };
        stateCopy[stateName] = selectedDoctor;

        this.setState({
            ...stateCopy
        })
    }

    handleOnChangeText = (event, id) => {
        let stateCopy = { ...this.state };
        stateCopy[id] = event.target.value;

        this.setState({
            ...stateCopy
        })
    }

    render() {
        let { hasOldData, listSpecialty } = this.state;
        //console.log('state: ', this.state)
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
                            placeholder={<FormattedMessage id="admin.manage-doctor.select-doctor" />}

                        />
                    </div>
                    <div className='content-right'>
                        <label><FormattedMessage id="admin.manage-doctor.information" /></label>
                        <textarea
                            className='form-control'
                            onChange={(event) => this.handleOnChangeText(event, 'description')}
                            value={this.state.description}
                        >
                        </textarea>
                    </div>
                </div>

                <div className='more-infor-extra row'>
                    <div className='col-6 form-group'>
                        <label><FormattedMessage id="admin.manage-doctor.price" /></label>
                        <Select
                            value={this.state.selectedPrice}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listPrice}
                            placeholder={<FormattedMessage id="admin.manage-doctor.price" />}
                            name="selectedPrice"
                        />
                    </div>
                    <div className='col-6 form-group'>
                        <label><FormattedMessage id="admin.manage-doctor.province" /></label>
                        <Select
                            value={this.state.selectedProvince}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listProvince}
                            placeholder={<FormattedMessage id="admin.manage-doctor.province" />}
                            name="selectedProvince"
                        />
                    </div>
                    <div className='col-6 form-group'>
                        <label><FormattedMessage id="admin.manage-doctor.nameClinic" /></label>
                        <Select
                            value={this.state.selectedClinicName}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listClinicName}
                            placeholder={<FormattedMessage id="admin.manage-doctor.nameClinic" />}
                            name="selectedClinicName"
                            isClearable
                        />
                    </div>
                    <div className='col-6 form-group'>
                        <label><FormattedMessage id="admin.manage-doctor.addressClinic" /></label>
                        <Select
                            value={this.state.selectedClinicAddress}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listClinicAddress}
                            placeholder={<FormattedMessage id="admin.manage-doctor.addressClinic" />}
                            name="selectedClinicAddress"
                            isClearable
                        />
                    </div>
                    <div className='col-12 form-group'>
                        <label><FormattedMessage id="admin.manage-doctor.note" /></label>
                        <input className='form-control'
                            onChange={(event) => this.handleOnChangeText(event, 'note')}
                            value={this.state.note}
                        />
                    </div>
                </div>

                <div className='row'>
                    <div className='col-12 form-group'>
                        <label>
                            <FormattedMessage id="admin.manage-doctor.select-specialty" />
                            <span style={{ color: '#006ea8', marginLeft: 8, fontSize: 13 }}>
                                (Có thể chọn nhiều chuyên khoa)
                            </span>
                        </label>
                        <Select
                            isMulti
                            value={this.state.selectedSpecialty}
                            onChange={(selectedOptions) => {
                                this.setState({ selectedSpecialty: selectedOptions || [] });
                            }}
                            options={this.state.listSpecialty}
                            placeholder={<FormattedMessage id="admin.manage-doctor.select-specialty" />}
                            name="selectedSpecialty"
                            closeMenuOnSelect={false}
                        />
                    </div>
                </div>

                <div className='manage-doctor-editor'>
                    <MdEditor
                        style={{ height: '300px' }}
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
                            <FormattedMessage id="admin.manage-doctor.save" />
                        </span>
                        :
                        <span>
                            <FormattedMessage id="admin.manage-doctor.create" />
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
