import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { StyleSheet, TouchableOpacity, View, Image, ScrollView, SafeAreaView, Switch, BackHandler, Dimensions } from "react-native";
import { Checkbox, Container } from '../../components';
import DefaultButton from "../../components/DefaultButton";
import AntDesign from "react-native-vector-icons/AntDesign";
import Feather from "react-native-vector-icons/Feather";
import { NEW_COLOR } from "../../constants/theme/variables";
import ParagraphComponent from "../../components/Paragraph/Paragraph";
import { s } from "../../constants/theme/scale";
import StepComponent from "../../components/steps/Steps";
import { commonStyles } from "../../components/CommonStyles";
import { formatCurrency, isErrorDispaly } from "../../utils/helpers";
import CardsModuleService from "../../services/card";
import ErrorComponent from "../../components/Error";
import { setPersonalInfo } from "../../redux/Actions/UserActions";
import CoinsDropdown from "../Tlv_Cards/CoinsDropDown";
import SendCryptoServices from "../../services/sendcrypto";
import CryptoServices from "../../services/crypto";
import CustomErrorComponent from "../../components/CustomError";
import { Formik } from "formik";
import { feePhysicalCardApplyValidation } from "./constant";
import FeePhysicalCardApply from "./physicalCardApply";
import Loadding from "../../components/skeleton";
import { ExchangeCardViewLoader } from "./CardsSkeleton_views";
import useEncryptDecrypt from "../../hooks/useEncryption_Decryption";
const { width } = Dimensions.get('window');
const isPad = width > 600;
const FeeStep = (props: any) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [applyCardsInfo, setCardsFeeInfo] = useState<any>({});
    const [errormsg, setErrormsg] = useState<string>('');
    const [custumErrormsg, setCustumErrormsg] = useState<{ isShow: boolean, errorList: string[] }>({ isShow: false, errorList: [] });
    const [btnLoading, setBtnLoading] = useState<boolean>(false);
    const [iHaveCard, setIHaveCard] = useState<{ haveCard: boolean, sendCard: boolean }>({ haveCard: false, sendCard: false });
    const { encryptAES } = useEncryptDecrypt();
    const stepContents = [
        <ParagraphComponent style={[commonStyles.fs12, commonStyles.textBlack, commonStyles.fw600]} text="Application information" />,
        <ParagraphComponent style={[commonStyles.fs12, commonStyles.textBlack, commonStyles.fw600]} text="Fee" />,
        <ParagraphComponent style={[commonStyles.fs12, commonStyles.textBlack, commonStyles.fw600,]} text="To Be Reviewed" />,
    ];
    const dispatch = useDispatch();
    const [coinsModelVisible, setCoinsModelVisible] = useState<boolean>(false);
    const [networkModelVisible, setNetworkModelVisible] = useState<boolean>(false)
    const [selectedCoin, setSelectedCoin] = useState<any>("");
    const [selectedNetwork, setSelectedNetwork] = useState<any>({})
    const [coinsDataList, setCoinsDataList] = useState<any>([]);
    const [networkList, setNetworkList] = useState<any>([]);
    const ExchangeCardSkeleton = ExchangeCardViewLoader();
    const ref = useRef<any>();
    let WalletId = "";
    const [physicalCardFormData, setPhysicalCardFormData] = useState({
        handHoldingIdPhoto: "",
        cardNumber: "",
        envelopenumber: ""

    });
    useEffect(() => {
        getCoinsList();
    }, [props?.route?.params?.cardId,
    props?.route?.params?.profileId,
    props?.route?.params?.logo]);

    const handleSelectedCoin = (coin: any) => {
        setSelectedCoin(coin);
        setCoinsModelVisible(false);
        getNetworkList(coin);
    };
    const handleSelectedNetwork = (network: any) => {
        setSelectedNetwork(network);
        setNetworkModelVisible(false);
        setErrormsg("");

    };

    const getCoinsList = async () => {
        setIsLoading(true);
        try {
            const response: any = await SendCryptoServices.getWithdrawCryptoCoinList();
            if (response?.ok && response?.status === 200) {
                setCoinsDataList(response?.data);
                setSelectedCoin(response?.data[0]?.walletCode);
                setErrormsg("");
                getNetworkList(response?.data[0]?.walletCode);              
            } else {
                ref?.current?.scrollTo({ y: 0, animated: true });
                setErrormsg(isErrorDispaly(response));
                setIsLoading(false);
            }
        } catch (error) {
            ref?.current?.scrollTo({ y: 0, animated: true });
            setErrormsg(isErrorDispaly(error));
            setIsLoading(false);

        }

    }
    const getNetworkList = async (coinName: string) => {
        setErrormsg("");
        try {
            const res: any = await CryptoServices.getCommonCryptoNetworks(coinName);
            if (res.status === 200) {
                setSelectedNetwork(res?.data[0])
                setNetworkList(res?.data);
                WalletId = res?.data[0]?.id;
                getApplyCardDeatilsInfo();
                setErrormsg("");
            } else {
                ref?.current?.scrollTo({ y: 0, animated: true });
                setErrormsg(isErrorDispaly(res));
                setIsLoading(false);
                setErrormsg("");
            }
        } catch (err) {
            ref?.current?.scrollTo({ y: 0, animated: true });
            setErrormsg(isErrorDispaly(err));
            setIsLoading(false);
            setErrormsg("");

        }
    }

    const getApplyCardDeatilsInfo = async (haveCardValue?: boolean) => {
        setErrormsg('')
        const cardId = props?.route?.params?.cardId;
        const cardValue = haveCardValue !== undefined ? haveCardValue : !iHaveCard.sendCard;
        try {
            const response: any = await CardsModuleService?.getApplyCardsCustomerFeeInfo(cardId, WalletId || selectedNetwork?.id, cardValue);
            if (response?.ok) {
                setCardsFeeInfo(response?.data);
                setSelectedCoin(response?.data?.paymentCurrency)
                setErrormsg('');
                setIsLoading(false);
            } else {
                ref?.current?.scrollTo({ y: 0, animated: true });
                setErrormsg(isErrorDispaly(response));
                setIsLoading(false);
            }
        } catch (error) {
            ref?.current?.scrollTo({ y: 0, animated: true });
            setErrormsg(isErrorDispaly(error));
            setIsLoading(false);
        }
    };
    const handleCustomerCardsWallet = async (values?: any) => {
        setBtnLoading(true);
        if (applyCardsInfo?.cardType === "Physical" && !iHaveCard.haveCard && !iHaveCard.sendCard) {
            setErrormsg("Please select at least one option: either 'I have the card on hand' or 'Please send a card to me'.");
            setBtnLoading(false);
            ref?.current?.scrollTo({ y: 0, animated: true });

            return;
        }
        setCustumErrormsg({ isShow: false, errorList: [] });
        let Obj = {
            "cardId": props?.route?.params?.cardId,
            "personalAddressId": null,
            "cryptoWalletId": selectedNetwork?.id,
            "iHaveCard": iHaveCard?.haveCard || false,
            "envelopeNumber": encryptAES(values?.envelopenumber) || null,
            "cardNumber": encryptAES(values?.cardNumber) || null,
            "handHoldIdPhoto": values?.handHoldingIdPhoto || null,
            "kycUpdateModel": props?.route?.params?.kycFormData || null
        }

        try {
            const res: any = await CardsModuleService?.saveCustomerCardsWallet(Obj)
            if (res.status === 200) {
                props.navigation.push("CardSuccess", {
                    cardId: props?.route?.params?.cardId,
                    cardWalletId: res?.data
                });
                setBtnLoading(false);
                dispatch(setPersonalInfo(""));
                setErrormsg('');
            } else {
                if (res.status === 523) {
                    if (res.data?.title.indexOf(',') > -1) {
                        setCustumErrormsg({ isShow: true, errorList: res.data?.title?.split(',') })
                    } else {
                        setCustumErrormsg({ isShow: true, errorList: [res.data?.title] })
                    }

                } else {
                    setErrormsg(isErrorDispaly(res));
                }
                setBtnLoading(false);
                ref?.current?.scrollTo({ y: 0, animated: true });
            }

        }
        catch (error) {
            ref?.current?.scrollTo({ y: 0, animated: true });
            setErrormsg(isErrorDispaly(error));
            setBtnLoading(false)
        }
    };

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => { handleBack(); return true; }
        );
        return () => backHandler.remove();
    }, []);
    const handleBack = () => {
        props.navigation.navigate("ApplyExchangaCard", {
            cardId: props?.route?.params?.cardId,
            logo: props?.route?.params?.logo,
            cardType: props?.route?.params?.cardType,
            kycFormData: props?.route?.params?.kycFormData,
            animation: "slide_from_left"
        },);
    };
    const selectHaveCard = (type: any) => {
        if (type === "haveCard") {
            if (!iHaveCard.haveCard) {
                setIHaveCard((prev) => ({ ...prev, haveCard: true, sendCard: false, }));
                getApplyCardDeatilsInfo(true);
            }
        }
        else if (type === "sendCard") {
            if (!iHaveCard.sendCard) {
                setIHaveCard((prev) => ({ ...prev, haveCard: false, sendCard: true, }));
                getApplyCardDeatilsInfo(false);
            }
        }

    };
    const handleCloseError = () => {
        setErrormsg("")
    }

    return (

        <SafeAreaView style={[commonStyles.flex1, commonStyles.screenBg]}>
            <ScrollView ref={ref}>
                <Container style={commonStyles.container}>
                    {isLoading && (
                        <View style={[commonStyles.flex1]}>
                            <Loadding contenthtml={ExchangeCardSkeleton} />
                        </View>
                    )}
                    { !isLoading && (
                        <View>
                            <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.mb30, commonStyles.gap16]}>
                                <TouchableOpacity style={[]} onPress={() => handleBack()}>
                                    <View>
                                        <AntDesign name="arrowleft" size={s(22)} color={NEW_COLOR.TEXT_BLACK} style={{ marginTop: 3 }} />
                                    </View>
                                </TouchableOpacity>
                                <ParagraphComponent text="Apply For Exchanga Pay Card" style={[commonStyles.fs16, commonStyles.textBlack, commonStyles.fw800]} />
                            </View>

                            <StepComponent totalSteps={3} currentStep={2} stepContents={stepContents} />
                            {errormsg && (<>
                                <ErrorComponent message={errormsg} onClose={handleCloseError} />
                                <View style={commonStyles.mt8} />
                            </>
                            )}

                            <Formik
                                initialValues={physicalCardFormData}
                                validationSchema={iHaveCard?.haveCard ? feePhysicalCardApplyValidation(applyCardsInfo) : undefined}
                                validateOnBlur={true}
                                validateOnChange={false}
                                enableReinitialize
                                onSubmit={handleCustomerCardsWallet}                           >
                                {formikProps => {
                                    const { touched, errors, handleBlur, values, setFieldValue, handleChange, handleSubmit } = formikProps;
                                    return (<>
                                        <View style={[commonStyles.sectionStyle, commonStyles.mb16]}>
                                            <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16]}>
                                                <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Payment Currency" />

                                                <TouchableOpacity style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.flex1, commonStyles.gap8]} onPress={() => { setCoinsModelVisible(true) }}>
                                                    <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={selectedCoin || ""} />
                                                    <Image style={styles.downArrow} source={require("../../assets/images/banklocal/down-arrow.png")} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={[commonStyles.dashedLine, commonStyles.mt10, commonStyles.mb10, { opacity: 0.5 }]} />

                                            <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16]}>
                                                <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Network" />
                                                <TouchableOpacity style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.flex1, commonStyles.gap8]} onPress={() => { setNetworkModelVisible(true) }}>
                                                    <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={selectedNetwork?.name || ""} />
                                                    <Image style={styles.downArrow} source={require("../../assets/images/banklocal/down-arrow.png")} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {custumErrormsg?.isShow && (<>
                                            <CustomErrorComponent
                                                message={'Please fill the below details to proceed:'}
                                                errList={custumErrormsg?.errorList}
                                                onClose={() => setCustumErrormsg({ isShow: false, errorList: [] })}
                                                link={''}
                                                navigation={props.navigation}
                                            />
                                            <View style={commonStyles.mt8} />
                                        </>
                                        )}
                                        <View style={commonStyles.mt8} />
                                        {isPad && <View style={[commonStyles.mb24]} />}
                                        {applyCardsInfo && (<>
                                            <View style={[styles.sectionBg, commonStyles.dflex, commonStyles.gap10, commonStyles.justifyContent, commonStyles.alignCenter]}>
                                                <View>
                                                    <View style={[commonStyles.dflex, commonStyles.justify, commonStyles.alignCenter]}>
                                                        <ParagraphComponent style={[commonStyles.fs36, commonStyles.fw600, commonStyles.textBlack]} text={`${formatCurrency(applyCardsInfo?.estimatedPaymentAmount || applyCardsInfo?.amountPaid || 0, 2)}`}>
                                                            <ParagraphComponent text={selectedCoin} style={[commonStyles.fs20, commonStyles.fw600]} /></ParagraphComponent>

                                                    </View>
                                                    <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw500, commonStyles.textBlack, styles.opacity6,]} text="Amount To Be Paid" />
                                                </View>
                                                <Image source={require("../../assets/images/cards/feehand.png")} />
                                            </View>
                                            <View style={[commonStyles.mb16]} />
                                            <View style={[styles.bgBlue, commonStyles.mb16, commonStyles.dflex, commonStyles.gap10]}>
                                                <Feather size={s(16)} name="info" color={NEW_COLOR.TEXT_ALWAYS_WHITE} style={{ marginTop: 4 }} />
                                                <View style={[commonStyles.flex1]}>
                                                    <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw500, commonStyles.textAlwaysWhite, { lineHeight: 19 }]} text={`Please pay the account opening fee${applyCardsInfo.cardType !== 'Virtual' ? ' ( Including Freight ' : ''}`}>
                                                        {applyCardsInfo.cardType !== 'Virtual' && <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw800, commonStyles.textAlwaysWhite, { lineHeight: 19 }]} text={`${applyCardsInfo?.freightFee}${" "}`} />}
                                                        <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw500, commonStyles.textAlwaysWhite, { lineHeight: 19 }]} text={`${applyCardsInfo.cardType !== 'Virtual' ? applyCardsInfo?.paymentCurrency + ')' : ''}, and after payment is successful, the card will be opened immediately`} />
                                                    </ParagraphComponent>
                                                </View>
                                            </View>


                                            {applyCardsInfo.cardType !== 'Virtual' && <View style={[commonStyles.sectionStyle, commonStyles.mb16]}>
                                                {applyCardsInfo.cardType !== 'Virtual' && <><TouchableOpacity onPress={() => selectHaveCard("haveCard")}  activeOpacity={1}>
                                                    <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16,]}>
                                                        <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="I have the card on hand and do not required freight" />
                                                        <Checkbox checked={iHaveCard?.haveCard} style={[{}, commonStyles.flex1]} />
                                                    </View>
                                                </TouchableOpacity>
                                                    <View style={[commonStyles.dashedLine, commonStyles.mt10, commonStyles.mb10, { opacity: 0.5 }]} /></>}
                                                {applyCardsInfo.cardType !== 'Virtual' && <><TouchableOpacity onPress={() => selectHaveCard("sendCard")}  activeOpacity={1}>
                                                    <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16,]}>
                                                        <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Please send a card to me" />
                                                        <Checkbox checked={iHaveCard?.sendCard} style={[{}, commonStyles.flex1]} />
                                                    </View>
                                                </TouchableOpacity>
                                                </>}



                                                {iHaveCard?.haveCard && (<View style={[commonStyles.mt16]}>
                                                    <FeePhysicalCardApply
                                                        touched={touched}
                                                        errors={errors}
                                                        handleBlur={handleBlur}
                                                        values={values}
                                                        setFieldValue={setFieldValue}
                                                        handleChange={handleChange} envelopeNoRequired={applyCardsInfo?.envelopeNoRequired} needPhotoForActiveCard={applyCardsInfo?.needPhotoForActiveCard} additionalDocforActiveCard={applyCardsInfo?.additionalDocforActiveCard} />
                                                </View>)}
                                            </View>}

                                            <View style={[commonStyles.sectionStyle]}>

                                                <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16,]}>
                                                    <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Issuing Fee" />

                                                    <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={`${formatCurrency(applyCardsInfo?.issuingFee || 0, 2)}${" "}`} />

                                                </View>
                                                <View style={[commonStyles.dashedLine, commonStyles.mt10, commonStyles.mb10, { opacity: 0.5 }]} />
                                                <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16,]}>
                                                    <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="First Recharge" />

                                                    <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={`${formatCurrency(applyCardsInfo?.firstRecharge || 0, 2)}${" "}`} />

                                                </View>
                                                <View style={[commonStyles.dashedLine, commonStyles.mt10, commonStyles.mb10, { opacity: 0.5 }]} />
                                                {(applyCardsInfo.cardType !== 'Virtual' && applyCardsInfo?.freightFee > 0) &&
                                                    <>
                                                        <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16]}>
                                                            <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Freight Fee" />
                                                            <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.flex1]}>
                                                                <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={`${formatCurrency(applyCardsInfo?.freightFee || 0, 2)}${" "}`} />
                                                            </View>
                                                        </View>
                                                        <View style={[commonStyles.dashedLine, commonStyles.mt10, commonStyles.mb10, { opacity: 0.5 }]} />
                                                    </>
                                                }


                                                <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16]}>
                                                    <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Estimated Payment Amount" />
                                                    <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.flex1]}>

                                                        <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={`${formatCurrency(applyCardsInfo?.estimatedPaymentAmount || 0, 2)}${" "}`} />
                                                    </View>
                                                </View>
                                                <View style={[commonStyles.dashedLine, commonStyles.mt10, commonStyles.mb10, { opacity: 0.5 }]} />
                                                <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.justifyContent, commonStyles.gap16]}>
                                                    <ParagraphComponent style={[commonStyles.fs12, commonStyles.fw400, commonStyles.textGrey, commonStyles.flex1]} text="Payment Currency" />
                                                    <View style={[commonStyles.dflex, commonStyles.alignCenter, commonStyles.flex1, commonStyles.gap8]}>
                                                        <ParagraphComponent style={[commonStyles.fs14, commonStyles.fw500, commonStyles.textBlack, commonStyles.textRight, commonStyles.flex1]} text={applyCardsInfo?.paymentCurrency} />

                                                    </View>
                                                </View>

                                            </View>
                                        </>)}
                                        <View style={commonStyles.mb43} />
                                        <DefaultButton
                                            title='Pay'
                                            style={undefined}
                                            // disable={btnLoading}
                                            loading={btnLoading}
                                            onPress={handleSubmit}
                                        />

                                        <View style={[commonStyles.mb24,]} /></>)
                                }}
                            </Formik>
                        </View>
                    )}
                </Container>
            </ScrollView>
            {coinsModelVisible && <CoinsDropdown coinsList={coinsDataList} modelvisible={() => { setCoinsModelVisible(false) }} handleSelect={handleSelectedCoin} label={"Coin"} fieldName={"walletCode"} selected={selectedCoin} />}
            {networkModelVisible && <CoinsDropdown coinsList={networkList} modelvisible={() => { setNetworkModelVisible(false) }} handleSelect={handleSelectedNetwork} label={"Network"} selected={selectedNetwork?.name} optional={true} />}

        </SafeAreaView>

    );
};

export default FeeStep;

const styles = StyleSheet.create({
    sectionBg: {
        borderWidth: 1, borderColor: NEW_COLOR.DASHED_BORDER_STYLE,
        borderRadius: 24,
        padding: 16,
        backgroundColor: NEW_COLOR.BG_PURPLERDARK, borderStyle: "dashed"
    },
    opacity6: { opacity: 0.6, },
    mb8: { marginBottom: 8, },
    bgBlue: {
        padding: 16,
        backgroundColor: NEW_COLOR.BG_BLUE,
        borderRadius: 16,
    },
    mr8: { marginRight: 8 },
    mt48: { marginTop: 48 },
    ml10: {},
});
