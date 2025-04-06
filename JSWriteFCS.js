/**
 * @author Xiangming Cai
 * Copyright(c) 2025
 * This software is released under the MIT license  (http://opensource.org/licenses/MIT)
 */

//import FCS from '../node_modules/fcs/fcs.js';
const FCS = require('./packages/fcs/fcs.js');
/**
 * JSWriteFCS 类，用于写入 FCS 文件
 */
class JSWriteFCS {
  /**
   * 构造函数
   * @param {Object} header - FCS文件头信息
   * @param {Object} text - FCS文件文本信息
   * @param {ArrayBuffer} data - FCS文件数据
   * @param {Object} analysis - FCS文件分析信息
   * @param {Object} options - 配置选项
   */
  constructor(header = {},text = {},data = null,analysis = {},options = {}) {
    this.header = header;
    this.text = text;
    this.analysis = analysis;// no analysis will be saved
    this.data = data;
    this.options = options;
  }

  /**
   * 写入 FCS 文件的方法
   * @param {String} fileName - 文件名
   * @param {object} savefolderHandle - Handle of folder to save
   */
  async writeFCS(fileName,savefolderHandle=null) {
    //prepare dataBlob and totalDataLength
    let dataBlob = convert2DArrayToBinary(this.data)
    let totalDataLength = dataBlob.byteLength

    //prepare totaltextLength
    let text_lengthcorrect = textReformer(this.text)
    let textBlob_lengthcorrect = formatTextSegment(text_lengthcorrect)
    let totaltextLength = textBlob_lengthcorrect.byteLength

    //update text and prepare textBlob
    let text_contentcorrect = textUpdater(this.text, totalDataLength,totaltextLength)
    let text_lengthcontent_bothcorrect = textReformer(text_contentcorrect)
    let textBlob = formatTextSegment(text_lengthcontent_bothcorrect)

    // prepare headerBlob
    let headerBlob = formatHeader(this.header,totaltextLength,totalDataLength)

    let fileBlob = new Blob([headerBlob, textBlob, dataBlob], { type: 'application/octet-stream' });

    if (savefolderHandle==null){
        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileBlob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }else{
        const chunkSize = 1024 * 1024 * 10; // 10MB
        const totalChunks = Math.ceil(fileBlob.size / chunkSize);


        const newFileHandle = await savefolderHandle.getFileHandle(fileName, { create: true });
        const writable = await newFileHandle.createWritable();

        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileBlob.size);
            const chunk = fileBlob.slice(start, end);

            await writable.write({ type: 'write', position: start, data: chunk });
        }

        
        //await writable.write(fileBlob);
        await writable.close();
    }
    
  }


  /**
   * 读取 FCS 文件的方法
   * @param {fcs} object - FCS object from MorganConrad/fcs 
   */
  readFCS(fcs) {
    this.header = fcs.get('header');
    this.text = fcs.get('text');
    this.analysis = fcs.get('analysis');
    this.data = fcs.get('data');
  }
  
}

function convert2DArrayToBinary(data) {
    // 创建一个缓冲区数组来存储二进制数据
    let bufferArray = [];
    let totalLength = 0;
    // 遍历二维数组，将每个元素转换为二进制数据并添加到缓冲区数组
    data.forEach(row => {
        row.forEach(value => {
            let valueBuffer = new ArrayBuffer(4); // 分配4个字节（32位）来存储浮点数
            let view = new DataView(valueBuffer);
            view.setFloat32(0, value, true); // 以小端字节序写入浮点数
            bufferArray.push(new Uint8Array(valueBuffer));
            totalLength += valueBuffer.byteLength; // 累加每个缓冲区的字节长度
        });
    });

    // 合并缓冲区数组
    const binaryData = Buffer.concat(bufferArray);
    
    return binaryData;
}


function formatTextSegment(text) {
    
    let formattedText = '';

    for (let key in text) {
        if (text.hasOwnProperty(key)) {
            formattedText += `*${key}*${text[key]}`;
        }
    }
    let textBlob = Buffer.from(formattedText);
    return textBlob;
}

function textReformer(text){
    //correct 
    text.$BEGINSTEXT = text.$BEGINSTEXT.toString().padStart(12, '0');
    text.$ENDSTEXT = text.$ENDSTEXT.toString().padStart(12, '0');
    text.$BEGINDATA = text.$BEGINDATA.toString().padStart(12, '0');
    text.$ENDDATA = text.$ENDDATA.toString().padStart(12, '0');
    text.$BEGINANALYSIS = text.$BEGINANALYSIS.toString().padStart(12, '0');
    text.$ENDANALYSIS = text.$ENDANALYSIS.toString().padStart(12, '0');
    
    text.$NEXTDATA = text.$NEXTDATA.toString().padStart(12, '0');

    //sort
    // 定义保留字段列表和正则表达式
    const reservedFields = [
        '$BEGINANALYSIS', '$BEGINDATA', '$BEGINSTEXT', '$BYTEORD', '$DATATYPE', 
        '$ENDANALYSIS', '$ENDDATA', '$ENDSTEXT', '$MODE', '$NEXTDATA', '$PAR', 
        '$TOT'
    ];
    const parameterFieldsRegex = /^\$P\d+[BERSN]$/;

    let newText = { ...text }
    const sortedText = {};
    Object.keys(newText).sort((a, b) => {
        const aIsReserved = reservedFields.includes(a) || parameterFieldsRegex.test(a);
        const bIsReserved = reservedFields.includes(b) || parameterFieldsRegex.test(b);
        // 如果a,b都是保留字段，则
        if (bIsReserved && aIsReserved) {
            if (a.startsWith('$P') && b.startsWith('$P')) {
                // 如果a是$PAR字段，则a排在前面
                if (a === '$PAR') {
                    return -1;
                }
                // 如果b是$PAR字段，则b排在前面
                if (b === '$PAR') {
                    return 1;
                }
                // 如果都是Pn,则按数字大小排序
                if (1) {
                    // 提取参数字段中的数字部分
                    const aNumber = parseInt(a.match(/\$P(\d+)/)[1], 10);
                    const bNumber = parseInt(b.match(/\$P(\d+)/)[1], 10);
                    // 如果数字部分相同，按字母顺序排序
                    if (aNumber === bNumber) {
                        return a.localeCompare(b);
                    }
                    // 按数字大小排序
                    return aNumber - bNumber;
                }
            }
        }

        // 如果a和b都是保留字段
        if (aIsReserved && bIsReserved) {
            // 如果a和b都是参数字段
            if (a.startsWith('$P') && b.startsWith('$P')) {
                // 提取参数字段中的数字部分
                const aNumber = parseInt(a.match(/\$P(\d+)/)[1], 10);
                const bNumber = parseInt(b.match(/\$P(\d+)/)[1], 10);

                // 按数字大小排序
                return aNumber - bNumber;
            }
            
            // 按字母顺序排序
            return a.localeCompare(b);
        }
        // 如果a是保留字段且b不是，则a排在前面
        if (aIsReserved && !bIsReserved) {
            return -1;
        }
        // 如果b是保留字段且a不是，则b排在前面
        if (bIsReserved && !aIsReserved) {
            return 1;
        }
        // 如果a是普通字段且b是#开头的字段，则a排在前面
        if (!a.startsWith('#') && b.startsWith('#')) {
            return -1;
        }
        // 如果b是普通字段且a是#开头的字段，则b排在前面
        if (!b.startsWith('#') && a.startsWith('#')) {
            return 1;
        }
        
        // 否则按字母顺序排序
        return a.localeCompare(b);
    }).forEach(key => {
        sortedText[key] = newText[key];
    });

    return sortedText;


}

function textUpdater(text, totalDataLength,totaltextLength){
    const textStart = 58; // usually the case
    const textEnd = textStart + totaltextLength - 1;

    const dataStart = textEnd + 1;
    const dataEnd = dataStart + totalDataLength - 1; // 4个字节（32位）

    text.$BEGINSTEXT = textStart;
    text.$ENDSTEXT = textEnd;
    text.$BEGINDATA = dataStart;
    text.$ENDDATA = dataEnd;
    text.$BEGINANALYSIS = 0;
    text.$ENDANALYSIS = 0;

    return text
}

function formatHeader(header,totaltextLength,totalDataLength){
    const FCSVersion = header.FCSVersion;

    const textStart = 58; // usually the case
    const textEnd = textStart + totaltextLength - 1;

    const dataStart = textEnd + 1;
    const dataEnd = dataStart + totalDataLength - 1; // 4个字节（32位）

    // header
    const FCSVersionString = FCSVersion + "    ";
    const beginText = textStart.toString().padStart(8, ' ');
    const endText = textEnd.toString().padStart(8, ' ');

    const beginData = dataStart.toString().padStart(8, ' ');
    const endData = dataEnd.toString().padStart(8, ' ');

    const beginAnalysis = '0'.padStart(8, ' ');
    const endAnalysis = '0'.padStart(8, ' ');

    const headerString = `${FCSVersionString}${beginText}${endText}${beginData}${endData}${beginAnalysis}${endAnalysis}`;
    let headerBlob = Buffer.from(headerString);

    return headerBlob;
}

module.exports = JSWriteFCS;