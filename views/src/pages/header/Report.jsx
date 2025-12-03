import { useState } from 'react';
import "./Report.css";

function Report() {



  return (
    <div className='spacing'>
      {/*gap with the header*/}
     <div className='container my-5 mt-5 p-5'>
       {/*center*/}
      <div className = "row justify-content-center">
         {/*Rresponsive*/}
        <div className='col-12 col-md-8 col-lg-9'>



           {/*container*/}
          <div className='border rounded-2 bg-white p-4 report-container d-flex flex-column align-items-start'>

           {/*Report header*/}
            <div className='spacing-report'>
          <div className='w-100 px-3 px-md-5 '>
            {/*Report title customized*/}
            <div className='text-start fw-bold fs-2 fs-md-1 h1 mb-4 report-title'>Report a Violation</div>

            <div></div>
          </div>

</div>


    {/*End of the container*/}
</div>

        </div>
      </div>

     </div>

    </div>
  );
}

export default Report;
