import * as XLSX from "xlsx";

export const exportExcel = (listofalluser,filename) => {
    if (!listofalluser || !Array.isArray(listofalluser) || listofalluser.length === 0) {
        console.error("No user data available to export.");
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(listofalluser);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const fileName = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
};
