const algoliasearch = require('algoliasearch');
const sanityClient = require('@sanity/client');

// Initialize Sanity client
const client = sanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, // Sanity Project ID
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET, // Sanity Dataset
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // API token for Sanity
});

// Initialize Algolia client
const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID, // Your Algolia App ID
  process.env.NEXT_PUBLIC_ALGOLIA_ADMIN_API_KEY // Your Algolia Admin API Key
);

const index = algoliaClient.initIndex('doctors'); // Define your index name in Algolia

async function pushDoctors() {
  try {
    // Fetch doctors from Sanity
    const doctors = await client.fetch(
      `*[_type == "doctor"]{
        _id,
        name,
        specialty,
        photo { asset->{url} },
        location,
        languages,
        appointmentFee,
        nextAvailableSlot,
        about
      }`
    );

    // Prepare the data for Algolia
    const formattedDoctors = doctors.map(doctor => ({
      objectID: doctor._id,
      name: doctor.name,
      specialty: doctor.specialty,
      photo: doctor.photo?.asset?.url,
      location: doctor.location,
      languages: doctor.languages,
      appointmentFee: doctor.appointmentFee,
      nextAvailableSlot: doctor.nextAvailableSlot,
      about: doctor.about,
    }));

    // Push the data to Algolia
    await index.saveObjects(formattedDoctors);
    console.log('Doctors data pushed to Algolia successfully!');
  } catch (error) {
    console.error('Error pushing doctors data to Algolia:', error);
  }
}

// Run the function to push data
pushDoctors();