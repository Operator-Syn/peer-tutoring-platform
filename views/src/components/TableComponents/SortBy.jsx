import Select from 'react-select';

export default function SortBy({ options, isClearable=true, isSearchable=false, onChange, }) {
     
    return (
        <div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
            <Select 
                options={options} 
                isClearable={isClearable}
                isSearchable={isSearchable}
                onChange={onChange}
            />
        </div>
        
    );
}