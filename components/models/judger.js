/**
 * @auth winn
 * @date 2019/11/9 10:02 PM
 */
import {SkuCode} from "./sku-code";
import {CellStatus} from "../../core/enum";
import {SkuPending} from "./sku-pending";
import {Joiner} from "../../utils/joiner";

class Judger {

    fenceGroup;
    pathDict = [];//所有路径
    SkuPending;

    constructor(fenceGroup) {
        this.fenceGroup = fenceGroup;
        this._initPathDict();
        this._initSkuPending();
    }

    /**
     * 初始化路径字典
     */
    _initPathDict() {
        this.fenceGroup.spu.sku_list.forEach(s => {
            const skuCode = new SkuCode(s.code);
            this.pathDict = this.pathDict.concat(skuCode.totalSegments);
        });
    }

    _initSkuPending() {
        this.SkuPending = new SkuPending();
    }

    judge(cell, x, y) {
        this._changeCurrentCellStatus(cell, x, y);
        // 处理其他cell 遍历所有cell（规格） 再遍历fence（每一行）
        this.fenceGroup.eachCell((cell, x, y)=>{
            if (this.SkuPending.isSelected(cell,x)) { //不处理已选中的cell
                return;
            }
            const path = this._findPotentialPath(cell, x, y);
            const isIn = this._isInDict(path);
            if (isIn) {
                this.fenceGroup.fences[x].cells[y].status = CellStatus.WAITING;
            } else {
                this.fenceGroup.fences[x].cells[y].status = CellStatus.FORBIDDEN;
            }
        });
    }

    _isInDict(path) {
        return this.pathDict.includes(path);
    }

    /**
     * 查找潜在路径
     * @private
     */
    _findPotentialPath(cell, x, y) {
        const joiner = new Joiner("#");
        for (let i = 0; i < this.fenceGroup.fences.length; i++) {
            const selected = this.SkuPending.findSelectedCellByX(i); //当前行是否有选中的
            if (x === i) { //当前行 直接添加
                const cellCode = this._getCellCode(cell.spec);
                joiner.join(cellCode);
            } else { //非当前行 加入选中行已选中的
                if (selected) {
                    const selectedCellCode = this._getCellCode(selected.spec);
                    joiner.join(selectedCellCode);
                }
            }
        }
        return joiner.getStr();
    }

    _getCellCode(spec) {
        return `${spec.key_id}-${spec.value_id}`;
    }

    /**
     * 处理当前选中cell
     * @param cell
     * @param x
     * @param y
     * @private
     */
    _changeCurrentCellStatus(cell, x, y) {
        if (cell.status === CellStatus.WAITING) {
            this.fenceGroup.fences[x].cells[y].status = CellStatus.SELECTED;
            this.SkuPending.insertCell(cell, x);
        }
        if (cell.status === CellStatus.SELECTED) {
            this.fenceGroup.fences[x].cells[y].status = CellStatus.WAITING;
            this.SkuPending.removeCell(x);
        }
    }
}

export {
    Judger
}