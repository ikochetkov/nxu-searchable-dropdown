
export default (state) => {

    const items = [
        { "id": "al", "label": "Alabama" },
        { "id": "ak", "label": "Alaska" },
        { "id": "az", "label": "Arizona" },
        { "id": "ar", "label": "Arkansas" },
        { "id": "ca", "label": "California" },
        { "id": "co", "label": "Colorado" }
    ]

    /*
          initialItemList: {
            default: []
        },
        select: { default: 'single' },
        placeholder: { default: '(empty)' },
        searchIcon: { default: "magnifying-glass-fill" },
        focusOnHover: { default: false },
        variant: { default: 'secondary' }
        */

    return (
        <div>
            <h1>testcomponent</h1>
            <searchable-dropdown 
            focusOnHover={true}
            initialItemList={items}/>
        </div>
    );
};
